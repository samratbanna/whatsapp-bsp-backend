import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// ── Wallet — one per organization ─────────────────────────────────────
export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, unique: true })
  organization: Types.ObjectId;

  // Message credits per category
  @Prop({ default: 0, min: 0 }) transactional: number;
  @Prop({ default: 0, min: 0 }) promotional: number;
  @Prop({ default: 0, min: 0 }) authentication: number;

  // Lifetime totals (for reporting)
  @Prop({ default: 0 }) totalTransactionalAdded: number;
  @Prop({ default: 0 }) totalPromotionalAdded: number;
  @Prop({ default: 0 }) totalAuthenticationAdded: number;

  @Prop({ default: 0 }) totalTransactionalUsed: number;
  @Prop({ default: 0 }) totalPromotionalUsed: number;
  @Prop({ default: 0 }) totalAuthenticationUsed: number;

  // Low credit alert thresholds
  @Prop({ default: 100 }) lowTransactionalThreshold: number;
  @Prop({ default: 100 }) lowPromotionalThreshold: number;
  @Prop({ default: 20 })  lowAuthenticationThreshold: number;

  @Prop({ default: false }) lowTransactionalAlertSent: boolean;
  @Prop({ default: false }) lowPromotionalAlertSent: boolean;
  @Prop({ default: false }) lowAuthenticationAlertSent: boolean;

  // Block sending when credits exhausted
  @Prop({ default: true }) blockOnEmpty: boolean;

  // Last partner top-up references applied to this wallet. The balance increment and the
  // reference are written in one atomic update, so a retried top-up can never credit twice.
  // Hidden: only partnerTopup() reads it, and no save() elsewhere ever touches it.
  @Prop({ type: [String], select: false, default: undefined })
  topupRefs?: string[];
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
WalletSchema.index({ organization: 1 }, { unique: true });

// ── Message category type ─────────────────────────────────────────────
export enum WalletCategory {
  TRANSACTIONAL  = 'transactional',
  PROMOTIONAL    = 'promotional',
  AUTHENTICATION = 'authentication',
}

// ── Wallet Transaction ledger ─────────────────────────────────────────
export type WalletTransactionDocument = WalletTransaction & Document;

export enum TransactionType {
  CREDIT = 'credit', // admin adds credits
  DEBIT  = 'debit',  // message sent
  REFUND = 'refund', // Meta delivery failure — credits returned
}

export enum TransactionReason {
  ADMIN_TOPUP   = 'admin_topup',   // super admin manually adds
  MESSAGE_USE   = 'message_use',   // deducted on send
  REFUND        = 'refund',        // Meta failure refund
  ADJUSTMENT    = 'adjustment',    // correction
  BONUS         = 'bonus',         // free credits
  EXPIRY        = 'expiry',        // credits expired (future)
  PURCHASE      = 'purchase',      // bought online (website plan via Airpay, or a partner like Swaad Boss)
  TRANSFER      = 'transfer',      // moved between a reseller and one of its clients (see counterparty)
}

@Schema({ timestamps: true })
export class WalletTransaction {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organization: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Wallet', required: true })
  wallet: Types.ObjectId;

  @Prop({ enum: TransactionType, required: true })
  type: TransactionType;

  @Prop({ enum: TransactionReason, required: true })
  reason: TransactionReason;

  // Which category of credits
  @Prop({ enum: WalletCategory, required: true })
  category: WalletCategory;

  // How many credits
  @Prop({ required: true, min: 1 })
  credits: number;

  // Snapshot before/after
  @Prop({ required: true }) creditsBefore: number;
  @Prop({ required: true }) creditsAfter: number;

  // References
  @Prop({ type: Types.ObjectId, ref: 'Message' })
  message?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Campaign' })
  campaign?: Types.ObjectId;

  @Prop({ trim: true }) metaMessageId?: string;
  @Prop({ trim: true }) description?: string;
  @Prop({ trim: true }) performedBy?: string; // admin userId for topups

  // Idempotency key for a credit that must land exactly once: a partner top-up (its order
  // number) or a website plan purchase (`order:<orderNumber>:<category>`). Unique per organization.
  @Prop({ trim: true }) reference?: string;

  // Reseller transfers: the other side of the move, and the id shared by both ledger rows.
  @Prop({ type: Types.ObjectId, ref: 'Organization' })
  counterparty?: Types.ObjectId;

  @Prop({ trim: true }) transferId?: string;
}

export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);
WalletTransactionSchema.index({ organization: 1, createdAt: -1 });
WalletTransactionSchema.index({ organization: 1, category: 1 });
WalletTransactionSchema.index({ metaMessageId: 1 });
WalletTransactionSchema.index({ organization: 1, reason: 1, createdAt: -1 });
// Only partner top-ups carry a reference, so every existing row is outside this index.
WalletTransactionSchema.index(
  { organization: 1, reference: 1 },
  { unique: true, partialFilterExpression: { reference: { $type: 'string' } } },
);
