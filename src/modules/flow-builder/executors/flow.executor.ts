import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import { Flow, FlowDocument, FlowSession, FlowSessionDocument, NodeType } from '../schemas/flow.schema';
import { MetaApiService } from '../../../common/services/meta-api.service';
import { WabaService } from '../../waba/waba.service';

@Injectable()
export class FlowExecutor {
  private readonly logger = new Logger(FlowExecutor.name);

  constructor(
    @InjectModel(Flow.name) private flowModel: Model<FlowDocument>,
    @InjectModel(FlowSession.name) private sessionModel: Model<FlowSessionDocument>,
    private metaApi: MetaApiService,
    private wabaService: WabaService,
  ) {}

  // ── Entry point — called from webhook on each inbound message ──────
  async processInbound(orgId: string, wabaDbId: string, message: any): Promise<void> {
    const phone = message.from;
    const text = message.text?.body || '';

    // 1. Check if there's an active session for this contact
    let session = await this.sessionModel.findOne({
      organization: new Types.ObjectId(orgId),
      phone,
      isActive: true,
    }).populate('flow');

    if (session) {
      await this.continueFlow(session, message, orgId, wabaDbId);
      return;
    }

    // 2. Find a matching flow trigger
    const flow = await this.findMatchingFlow(orgId, text);
    if (!flow) return;

    // 3. Start new session
    const triggerNode = flow.nodes.find((n) => n.type === NodeType.TRIGGER);
    if (!triggerNode) return;

    session = await this.sessionModel.create({
      organization: new Types.ObjectId(orgId),
      phone,
      flow: flow._id,
      currentNodeId: triggerNode.next || triggerNode.id,
      variables: { contact_phone: phone },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await this.flowModel.findByIdAndUpdate(flow._id, { $inc: { triggerCount: 1 } });
    await this.executeFromNode(session, flow, message, orgId, wabaDbId);
  }

  // ── Continue an existing session ───────────────────────────────────
  private async continueFlow(
    session: FlowSessionDocument,
    message: any,
    orgId: string,
    wabaDbId: string,
  ): Promise<void> {
    const flow = session.flow as unknown as FlowDocument;
    const currentNode = flow.nodes.find((n) => n.id === session.currentNodeId);
    if (!currentNode) {
      await this.endSession(session);
      return;
    }

    // Store user input as variable if node expects it
    if (currentNode.data?.captureInput) {
      const varName = currentNode.data.variableName || 'last_input';
      session.variables[varName] = message.text?.body || '';
      await session.save();
    }

    await this.executeFromNode(session, flow, message, orgId, wabaDbId);
  }

  // ── Execute nodes starting from session.currentNodeId ─────────────
  private async executeFromNode(
    session: FlowSessionDocument,
    flow: FlowDocument,
    message: any,
    orgId: string,
    wabaDbId: string,
  ): Promise<void> {
    const waba = await this.wabaService.findOne(wabaDbId, orgId);
    let nodeId = session.currentNodeId;
    const maxSteps = 20; // prevent infinite loops
    let steps = 0;

    while (nodeId && steps < maxSteps) {
      const node = flow.nodes.find((n) => n.id === nodeId);
      if (!node) break;
      steps++;

      try {
        const result = await this.executeNode(node, session, waba, message);

        if (result === 'end' || node.type === NodeType.END) {
          await this.endSession(session);
          await this.flowModel.findByIdAndUpdate(flow._id, { $inc: { completionCount: 1 } });
          break;
        }

        if (result === 'wait') {
          // Node is waiting for user input — save current position
          session.currentNodeId = nodeId;
          await session.save();
          break;
        }

        if (result === 'reset') {
          await this.endSession(session);
          break;
        }

        // Move to next node
        nodeId = result || node.next || '';
        session.currentNodeId = nodeId;
        await session.save();
      } catch (err) {
        this.logger.error(`Flow node error [${node.type}]: ${err.message}`);
        break;
      }
    }
  }

  // ── Execute a single node ──────────────────────────────────────────
  private async executeNode(
    node: any,
    session: FlowSessionDocument,
    waba: any,
    message: any,
  ): Promise<string> {
    switch (node.type as NodeType) {
      case NodeType.TRIGGER:
        return node.next || 'end';

      case NodeType.SEND_TEXT: {
        const text = this.interpolate(node.data.text || '', session.variables);
        await this.metaApi.sendMessageAutoRefresh(
          waba.phoneNumberId,
          waba.accessToken,
          {
            to: session.phone,
            type: 'text',
            text: { body: text },
          },
          async (newToken) => {
            waba.accessToken = newToken;
            await this.wabaService.updateAccessToken(waba._id.toString(), newToken);
          },
        );
        return node.next || 'end';
      }

      case NodeType.SEND_TEMPLATE: {
        await this.metaApi.sendMessageAutoRefresh(
          waba.phoneNumberId,
          waba.accessToken,
          {
            to: session.phone,
            type: 'template',
            template: {
              name: node.data.templateName,
              language: { code: node.data.languageCode || 'en_US' },
              components: node.data.components || [],
            },
          },
          async (newToken) => {
            waba.accessToken = newToken;
            await this.wabaService.updateAccessToken(waba._id.toString(), newToken);
          },
        );
        return node.next || 'end';
      }

      case NodeType.CONDITION: {
        const inputVal = (
          session.variables[node.data.variable] || message.text?.body || ''
        ).toLowerCase().trim();

        for (const branch of node.branches || []) {
          const condition = branch.condition.toLowerCase().trim();
          if (
            condition === inputVal ||
            inputVal.includes(condition) ||
            (node.data.matchType === 'contains' && inputVal.includes(condition))
          ) {
            return branch.next;
          }
        }
        return node.next || 'end'; // default branch
      }

      case NodeType.SET_VARIABLE: {
        const val = this.interpolate(node.data.value || '', session.variables);
        session.variables[node.data.name] = val;
        await session.save();
        return node.next || 'end';
      }

      case NodeType.API_REQUEST: {
        try {
          const url = this.interpolate(node.data.url, session.variables);
          const method = (node.data.method || 'GET').toLowerCase();
          const body = node.data.body
            ? JSON.parse(this.interpolate(JSON.stringify(node.data.body), session.variables))
            : undefined;

          const response = await axios({ method, url, data: body, timeout: 10000 });

          // Store response fields as variables
          if (node.data.responseMapping) {
            for (const [varName, path] of Object.entries(node.data.responseMapping)) {
              const parts = (path as string).split('.');
              let val: any = response.data;
              for (const part of parts) val = val?.[part];
              if (val !== undefined) session.variables[varName] = String(val);
            }
            await session.save();
          }
        } catch (err) {
          this.logger.warn(`API request node failed: ${err.message}`);
          if (node.data.onError === 'continue') return node.next || 'end';
          return 'end';
        }
        return node.next || 'end';
      }

      case NodeType.DELAY: {
        const ms = (node.data.seconds || 1) * 1000;
        await new Promise((r) => setTimeout(r, Math.min(ms, 5000))); // max 5s in flow
        return node.next || 'end';
      }

      case NodeType.JUMP:
        return node.data.targetNodeId || 'end';

      case NodeType.RESET_FLOW:
        return 'reset';

      case NodeType.END:
        return 'end';

      default:
        return node.next || 'end';
    }
  }

  // ── Find matching flow by trigger keyword ──────────────────────────
  private async findMatchingFlow(orgId: string, text: string): Promise<FlowDocument | null> {
    const flows = await this.flowModel
      .find({ organization: new Types.ObjectId(orgId), status: 'active' })
      .sort({ priority: -1 })
      .exec();

    for (const flow of flows) {
      const trigger = flow.trigger;
      if (trigger.type === 'any_message') return flow;
      if (trigger.type === 'keyword' && trigger.keywords?.length) {
        const input = trigger.caseSensitive ? text : text.toLowerCase();
        const match = trigger.keywords.some((kw) => {
          const k = trigger.caseSensitive ? kw : kw.toLowerCase();
          return input === k || input.startsWith(k);
        });
        if (match) return flow;
      }
    }

    return null;
  }

  private async endSession(session: FlowSessionDocument): Promise<void> {
    session.isActive = false;
    await session.save();
  }

  private interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
  }
}
