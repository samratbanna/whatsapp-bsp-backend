import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import { Flow, FlowDocument, FlowSession, FlowSessionDocument, FlowCompletion, FlowCompletionDocument, FlowLog, FlowLogDocument, NodeType } from '../schemas/flow.schema';
import { MetaApiService } from '../../../common/services/meta-api.service';
import { WabaService } from '../../waba/waba.service';
import { AiReplyService } from '../../ai-agents/ai-reply.service';

@Injectable()
export class FlowExecutor {
  private readonly logger = new Logger(FlowExecutor.name);

  constructor(
    @InjectModel(Flow.name) private flowModel: Model<FlowDocument>,
    @InjectModel(FlowSession.name) private sessionModel: Model<FlowSessionDocument>,
    @InjectModel(FlowCompletion.name) private completionModel: Model<FlowCompletionDocument>,
    @InjectModel(FlowLog.name) private logModel: Model<FlowLogDocument>,
    private metaApi: MetaApiService,
    private wabaService: WabaService,
    @Optional() private aiReplyService?: AiReplyService,
  ) {}

  // ── Entry point — called from webhook on each inbound message ──────
  async processInbound(orgId: string, wabaDbId: string, message: any): Promise<boolean> {
    const phone = message.from;
    const text = message.text?.body || '';
    this.logger.log(`FlowExecutor: inbound from=${phone} text="${text}" orgId=${orgId}`);

    // 1. Check if there's an active session for this contact
    let session = await this.sessionModel.findOne({
      organization: new Types.ObjectId(orgId),
      phone,
      isActive: true,
    }).populate('flow');

    if (session) {
      this.logger.log(`FlowExecutor: resuming session ${session._id} at node ${session.currentNodeId}`);
      await this.continueFlow(session, message, orgId, wabaDbId);
      return true;
    }

    // 2. Find a matching flow trigger
    const flow = await this.findMatchingFlow(orgId, text);
    if (!flow) {
      this.logger.log(`FlowExecutor: no matching flow for orgId=${orgId} text="${text}"`);
      return false;
    }
    this.logger.log(`FlowExecutor: matched flow "${flow.name}" (${flow._id})`);

    // 3. Repeat policy check
    const policy = (flow as any).repeatPolicy || 'always';
    if (policy !== 'always') {
      const existing = await this.completionModel.findOne({
        organization: new Types.ObjectId(orgId),
        phone,
        flow: flow._id,
      });
      if (existing) {
        this.logger.log(`FlowExecutor: repeat blocked (policy=${policy}) for phone=${phone} flow="${flow.name}"`);
        return false;
      }
    }

    // 4. Start new session
    this.logger.log(`FlowExecutor: flow nodes = ${JSON.stringify(flow.nodes.map(n => ({ id: n.id, type: n.type, next: n.next })))}`);
    const triggerNode = flow.nodes.find((n) => n.type === NodeType.TRIGGER);
    if (!triggerNode) {
      this.logger.warn(`FlowExecutor: flow "${flow.name}" has no TRIGGER node — skipping`);
      return false;
    }
    this.logger.log(`FlowExecutor: triggerNode.next="${triggerNode.next}"`);

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
    return true;
  }

  // ── Continue an existing session ───────────────────────────────────
  private async continueFlow(
    session: FlowSessionDocument,
    message: any,
    orgId: string,
    wabaDbId: string,
  ): Promise<void> {
    const flow = session.flow as unknown as FlowDocument;
    this.logger.log(`continueFlow: sessionId=${session._id} currentNodeId=${session.currentNodeId} flowNodes=${flow?.nodes?.length ?? 'N/A'}`);
    const currentNode = flow.nodes.find((n) => n.id === session.currentNodeId);
    if (!currentNode) {
      this.logger.warn(`continueFlow: node "${session.currentNodeId}" not found in flow — ending session`);
      await this.endSession(session);
      return;
    }
    this.logger.log(`continueFlow: currentNode type=${currentNode.type}`);

    if (currentNode.type === NodeType.AI_AGENT) {
      // In AI conversation mode: route this message through the AI agent
      await this.handleAiAgentContinue(currentNode, session, flow, message, orgId, wabaDbId);
      return;
    } else if (currentNode.type === NodeType.ASK_QUESTION) {
      const received = message.text?.body || '';
      const varName = currentNode.data.variableName || 'last_input';
      session.variables[varName] = received;
      session.currentNodeId = currentNode.next || '';
      await session.save();
      await this.addLog(session, { nodeType: currentNode.type, nodeLabel: currentNode.label, received });
    } else if (currentNode.type === NodeType.QUICK_REPLY) {
      const buttonId = message.interactive?.button_reply?.id || message.text?.body || '';
      const received = message.interactive?.button_reply?.title || buttonId;
      const matched = (currentNode.data.buttons || []).find((b: any) => b.id === buttonId);
      if (currentNode.data.variableName) {
        session.variables[currentNode.data.variableName] = received;
      }
      session.currentNodeId = matched?.next || currentNode.next || '';
      await session.save();
      await this.addLog(session, { nodeType: currentNode.type, nodeLabel: currentNode.label, received });
    } else if (currentNode.data?.captureInput) {
      const received = message.text?.body || '';
      const varName = currentNode.data.variableName || 'last_input';
      session.variables[varName] = received;
      await session.save();
      await this.addLog(session, { nodeType: currentNode.type, nodeLabel: currentNode.label, received });
    }

    await this.executeFromNode(session, flow, message, orgId, wabaDbId);
  }

  // ── Handle AI_AGENT node when session is already parked there ────────
  private async handleAiAgentContinue(
    node: any,
    session: FlowSessionDocument,
    flow: FlowDocument,
    message: any,
    orgId: string,
    wabaDbId: string,
  ): Promise<void> {
    if (!this.aiReplyService) {
      this.logger.warn('AI_AGENT continue: AiReplyService not available');
      return;
    }

    const userText = message.text?.body || '';
    const agentId: string | undefined = node.data?.agentId || undefined;
    const maxReplies: number = node.data?.maxReplies ?? 0; // 0 = unlimited
    const aiTurns: number = Number(session.variables['__ai_turns'] ?? 0);

    let waba: any;
    try {
      waba = await this.wabaService.findOne(wabaDbId, orgId);
    } catch (err: any) {
      this.logger.error(`AI_AGENT continue: WABA lookup failed — ${err?.message}`);
      return;
    }

    // Call AI
    let aiReply: string | null = null;
    let handoff = false;
    try {
      const result = await this.aiReplyService.processMessage({
        phone: session.phone,
        text: userText,
        orgId,
        agentId,
      });
      aiReply = result?.reply ?? null;
      handoff = result?.handoff ?? false;
    } catch (err: any) {
      this.logger.error(`AI_AGENT continue error: ${err?.message}`);
    }

    if (aiReply) {
      await this.metaApi.sendMessageAutoRefresh(
        waba.phoneNumberId,
        waba.accessToken,
        { to: session.phone, type: 'text', text: { body: aiReply } },
        async (newToken) => {
          waba.accessToken = newToken;
          await this.wabaService.updateAccessToken(waba._id.toString(), newToken);
        },
      );
      await this.addLog(session, {
        nodeType: node.type,
        nodeLabel: node.label,
        received: userText,
        sent: aiReply,
      });
    }

    // Increment AI turn counter in session
    session.variables['__ai_turns'] = String(aiTurns + 1);
    await session.save();

    // Exit AI node when: AI triggered handoff OR maxReplies reached
    const replyLimitHit = maxReplies > 0 && (aiTurns + 1) >= maxReplies;
    if (handoff || replyLimitHit) {
      this.logger.log(`AI_AGENT: exiting (handoff=${handoff}, replyLimitHit=${replyLimitHit})`);
      session.variables['__ai_turns'] = '0';
      session.currentNodeId = node.next || '';
      await session.save();
      if (node.next) {
        await this.executeFromNode(session, flow, message, orgId, wabaDbId);
      } else {
        await this.endSession(session, flow);
      }
    }
    // Otherwise stay parked at this node — next message will come back here
  }

  // ── Execute nodes starting from session.currentNodeId ─────────────
  private async executeFromNode(
    session: FlowSessionDocument,
    flow: FlowDocument,
    message: any,
    orgId: string,
    wabaDbId: string,
  ): Promise<void> {
    this.logger.log(`executeFromNode: wabaDbId=${wabaDbId} orgId=${orgId} startNode=${session.currentNodeId}`);
    let waba: any;
    try {
      waba = await this.wabaService.findOne(wabaDbId, orgId);
      this.logger.log(`executeFromNode: waba found phoneNumberId=${waba.phoneNumberId}`);
    } catch (err: any) {
      this.logger.error(`executeFromNode: WABA lookup failed — ${err?.message ?? err}`);
      return;
    }

    let nodeId = session.currentNodeId;
    const maxSteps = 20; // prevent infinite loops
    let steps = 0;

    while (nodeId && steps < maxSteps) {
      const node = flow.nodes.find((n) => n.id === nodeId);
      if (!node) {
        this.logger.warn(`executeFromNode: node "${nodeId}" not found in flow — stopping`);
        break;
      }
      steps++;
      this.logger.log(`executeFromNode: step=${steps} nodeId=${nodeId} type=${node.type}`);

      try {
        const result = await this.executeNode(node, session, waba, message);
        this.logger.log(`executeFromNode: node ${node.type} result="${result}"`);

        if (result === 'end' || node.type === NodeType.END) {
          await this.endSession(session, flow);
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
      } catch (err: any) {
        this.logger.error(`Flow node error [${node.type}]: ${err?.message ?? err}`);
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
          { to: session.phone, type: 'text', text: { body: text } },
          async (newToken) => {
            waba.accessToken = newToken;
            await this.wabaService.updateAccessToken(waba._id.toString(), newToken);
          },
        );
        await this.addLog(session, { nodeType: node.type, nodeLabel: node.label, sent: text });
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
        } catch (err: any) {
          this.logger.warn(`API request node failed: ${err?.message ?? err}`);
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

      case NodeType.ASK_QUESTION: {
        const question = this.interpolate(node.data.question || '', session.variables);
        await this.metaApi.sendMessageAutoRefresh(
          waba.phoneNumberId,
          waba.accessToken,
          { to: session.phone, type: 'text', text: { body: question } },
          async (newToken) => {
            waba.accessToken = newToken;
            await this.wabaService.updateAccessToken(waba._id.toString(), newToken);
          },
        );
        await this.addLog(session, { nodeType: node.type, nodeLabel: node.label, sent: question });
        return 'wait';
      }

      case NodeType.QUICK_REPLY: {
        const body = this.interpolate(node.data.body || '', session.variables);
        const buttons = (node.data.buttons as any[] || []).slice(0, 3).map((b) => ({
          type: 'reply',
          reply: { id: b.id, title: b.title },
        }));
        await this.metaApi.sendMessageAutoRefresh(
          waba.phoneNumberId,
          waba.accessToken,
          {
            to: session.phone,
            type: 'interactive',
            interactive: { type: 'button', body: { text: body }, action: { buttons } },
          },
          async (newToken) => {
            waba.accessToken = newToken;
            await this.wabaService.updateAccessToken(waba._id.toString(), newToken);
          },
        );
        const buttonTitles = (node.data.buttons as any[] || []).map((b) => b.title).join(' / ');
        await this.addLog(session, { nodeType: node.type, nodeLabel: node.label, sent: `${body} [${buttonTitles}]` });
        return 'wait';
      }

      case NodeType.AI_AGENT: {
        if (!this.aiReplyService) {
          this.logger.warn('AI_AGENT node: AiReplyService not available — skipping');
          return node.next || 'end';
        }

        const agentId: string | undefined = node.data?.agentId || undefined;
        const waitForReply: boolean = node.data?.waitForReply ?? true;
        const inputText =
          node.data?.inputVariable
            ? (session.variables[node.data.inputVariable] ?? message?.text?.body ?? '')
            : (message?.text?.body ?? '');

        const orgId = session.organization.toString();
        const wabaId = session.flow?.toString(); // flow's waba context passed via session

        let aiReply: string | null = null;
        try {
          const result = await this.aiReplyService.processMessage({
            phone: session.phone,
            text: inputText,
            orgId,
            agentId,
          });
          aiReply = result?.reply ?? null;
        } catch (err: any) {
          this.logger.error(`AI_AGENT node error: ${err?.message}`);
        }

        if (aiReply) {
          await this.metaApi.sendMessageAutoRefresh(
            waba.phoneNumberId,
            waba.accessToken,
            { to: session.phone, type: 'text', text: { body: aiReply } },
            async (newToken) => {
              waba.accessToken = newToken;
              await this.wabaService.updateAccessToken(waba._id.toString(), newToken);
            },
          );
          await this.addLog(session, { nodeType: node.type, nodeLabel: node.label, sent: aiReply });
        }

        // waitForReply = true → stay at this node for ongoing conversation
        // waitForReply = false → send one reply and continue to next node
        return waitForReply ? 'wait' : node.next || 'end';
      }

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
    this.logger.log(`findMatchingFlow START: orgId=${orgId} text="${text}"`);
    const flows = await this.flowModel
      .find({ organization: new Types.ObjectId(orgId), status: 'active' })
      .sort({ priority: -1 })
      .exec();

    this.logger.log(
      `findMatchingFlow RESULT: found ${flows.length} active flow(s): ` +
      flows.map((f) => `"${f.name}"[${f._id}](trigger=${f.trigger?.type},keys=${JSON.stringify(f.trigger?.keywords)})`).join(', '),
    );

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

  private async addLog(
    session: FlowSessionDocument,
    entry: { nodeType: string; nodeLabel?: string; sent?: string; received?: string },
  ): Promise<void> {
    try {
      await this.logModel.create({
        organization: session.organization,
        phone: session.phone,
        flow: session.flow,
        session: session._id,
        nodeType: entry.nodeType,
        nodeLabel: entry.nodeLabel,
        sent: entry.sent,
        received: entry.received,
        timestamp: new Date(),
      });
    } catch (err: any) {
      this.logger.warn(`addLog failed: ${err?.message}`);
    }
  }

  private async endSession(session: FlowSessionDocument, flow?: FlowDocument): Promise<void> {
    session.isActive = false;
    await session.save();

    if (!flow) return;
    const policy = (flow as any).repeatPolicy || 'always';
    if (policy === 'always') return;

    const cooldownDays = (flow as any).cooldownDays || 0;
    // 'once' → never expires (year 9999); 'cooldown' → expires after cooldownDays
    const expiresAt = policy === 'once'
      ? new Date('9999-12-31')
      : new Date(Date.now() + cooldownDays * 24 * 60 * 60 * 1000);

    await this.completionModel.updateOne(
      { organization: session.organization, phone: session.phone, flow: flow._id },
      { $set: { expiresAt } },
      { upsert: true },
    );
    this.logger.log(`FlowExecutor: completion recorded policy=${policy} phone=${session.phone} expiresAt=${expiresAt.toISOString()}`);
  }

  private interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
  }
}
