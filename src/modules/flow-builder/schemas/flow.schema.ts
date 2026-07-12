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
  ASK_QUESTION = 'ask_question',
  QUICK_REPLY = 'quick_reply',
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

  // Repeat policy — how many times can this flow run per contact
  @Prop({ enum: ['once', 'cooldown', 'always'], default: 'once' })
  repeatPolicy: 'once' | 'cooldown' | 'always';

  // Only used when repeatPolicy = 'cooldown' — number of days before flow can repeat
  @Prop({ default: 0 })
  cooldownDays: number;
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

// ── Flow Completion — tracks per-contact flow completions for repeat policy ──

export type FlowCompletionDocument = FlowCompletion & Document;

@Schema({ timestamps: true })
export class FlowCompletion {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organization: Types.ObjectId;

  @Prop({ required: true })
  phone: string;

  @Prop({ type: Types.ObjectId, ref: 'Flow', required: true })
  flow: Types.ObjectId;

  // TTL field — set far future for 'once', or completedAt + cooldownDays for 'cooldown'
  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const FlowCompletionSchema = SchemaFactory.createForClass(FlowCompletion);
FlowCompletionSchema.index({ organization: 1, phone: 1, flow: 1 });
FlowCompletionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ── Flow Log — per-interaction conversation record ────────────────────────────

export type FlowLogDocument = FlowLog & Document;

@Schema({ timestamps: true })
export class FlowLog {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organization: Types.ObjectId;

  @Prop({ required: true })
  phone: string;

  @Prop({ type: Types.ObjectId, ref: 'Flow', required: true })
  flow: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FlowSession', required: true })
  session: Types.ObjectId;

  @Prop({ required: true })
  nodeType: string;

  @Prop()
  nodeLabel?: string;

  @Prop()
  sent?: string;      // bot ka message

  @Prop()
  received?: string;  // user ka reply

  @Prop({ type: Date, default: () => new Date() })
  timestamp: Date;
}

export const FlowLogSchema = SchemaFactory.createForClass(FlowLog);
FlowLogSchema.index({ organization: 1, flow: 1, session: 1 });
FlowLogSchema.index({ organization: 1, phone: 1 });
