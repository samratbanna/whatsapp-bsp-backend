import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FlowDocument = Flow & Document;

export enum FlowStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
}

export enum NodeType {
  TRIGGER = 'trigger',         // entry point — keyword / any message
  SEND_TEXT = 'send_text',
  SEND_TEMPLATE = 'send_template',
  SEND_MEDIA = 'send_media',
  CONDITION = 'condition',     // branch on input / variable
  SET_VARIABLE = 'set_variable',
  API_REQUEST = 'api_request', // call external API
  DELAY = 'delay',
  JUMP = 'jump',               // jump to another node
  END = 'end',
  ASSIGN_AGENT = 'assign_agent',
  ADD_LABEL = 'add_label',
  RESET_FLOW = 'reset_flow',
}

@Schema({ timestamps: true })
export class Flow {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organization: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Waba', required: true })
  waba: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ enum: FlowStatus, default: FlowStatus.DRAFT })
  status: FlowStatus;

  // Trigger config — what starts this flow
  @Prop({
    type: Object,
    default: { type: 'keyword', keywords: [] },
  })
  trigger: {
    type: 'keyword' | 'any_message' | 'opt_in' | 'button_reply';
    keywords?: string[];          // e.g. ["hi", "hello", "start"]
    caseSensitive?: boolean;
  };

  // Nodes array — full graph
  @Prop({ type: [Object], default: [] })
  nodes: {
    id: string;                   // uuid
    type: NodeType;
    label?: string;
    position?: { x: number; y: number }; // for frontend canvas
    data: Record<string, any>;    // node-specific config
    next?: string;                // default next node id
    branches?: {                  // for condition nodes
      condition: string;
      next: string;
    }[];
  }[];

  // Stats
  @Prop({ default: 0 })
  triggerCount: number;

  @Prop({ default: 0 })
  completionCount: number;

  // Priority when multiple flows match
  @Prop({ default: 0 })
  priority: number;
}

export const FlowSchema = SchemaFactory.createForClass(Flow);
FlowSchema.index({ organization: 1, status: 1 });

// ── Flow Session — tracks where a contact is in a flow ────────────────

export type FlowSessionDocument = FlowSession & Document;

@Schema({ timestamps: true, expireAfterSeconds: 86400 }) // auto-expire after 24h
export class FlowSession {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organization: Types.ObjectId;

  @Prop({ required: true })
  phone: string;

  @Prop({ type: Types.ObjectId, ref: 'Flow', required: true })
  flow: Types.ObjectId;

  @Prop({ required: true })
  currentNodeId: string;

  // Variables collected during flow
  @Prop({ type: Object, default: {} })
  variables: Record<string, string>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: () => new Date() })
  expiresAt: Date;
}

export const FlowSessionSchema = SchemaFactory.createForClass(FlowSession);
FlowSessionSchema.index({ organization: 1, phone: 1 });
FlowSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
