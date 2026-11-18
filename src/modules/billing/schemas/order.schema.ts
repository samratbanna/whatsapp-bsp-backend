import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import type { WalletCategory } from '../../wallet/schemas/wallet.schema';

export type OrderDocument = Order &
  Document & { createdAt: Date; updatedAt: Date };

export enum OrderStatus {
  CREATED = 'created', // checkout form handed to the browser; nothing heard from the gateway yet
  PENDING = 'pending', // gateway says processing
  PAID = 'paid', // confirmed — credits are (or are being) loaded
  FAILED = 'failed', // failed, cancelled, or never completed
}

/** One line of an order: N messages of a category at the buyer's rate, frozen at checkout. */
@Schema({ _id: false })
export class OrderItem {
  @Prop({
    type: String,
    enum: ['transactional', 'promotional', 'authentication'],
    required: true,
  })
  category: WalletCategory;

  @Prop({ type: Number, required: true, min: 1 }) quantity: number;
  @Prop({ type: Number, required: true }) ratePaise: number;
  @Prop({ type: Number, required: true }) amountPaise: number;

  // Balance purchases: what the same messages cost the reseller (its own rate), for its margin.
  @Prop({ type: Number }) costRatePaise?: number;
}
const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class OrderBuyer {
  @Prop() name: string;
  @Prop() email: string;
  @Prop() phone: string;
}
const OrderBuyerSchema = SchemaFactory.createForClass(OrderBuyer);

@Schema({ timestamps: true })
export class Order {
  // Our id, sent to the gateway as `orderid` (Airpay: alphanumeric, ≤ 30).
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organization: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  // What was sold, at the rates that applied at checkout — later rate changes don't touch it.
  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true }) subtotalPaise: number;
  @Prop({ required: true }) gstPercent: number;
  @Prop({ required: true }) gstPaise: number;
  @Prop({ required: true }) totalPaise: number;

  // totalPaise as the gateway sees it, e.g. "2358.82".
  @Prop({ required: true }) amount: string;

  @Prop({ default: 'INR' }) currency: string;

  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.CREATED,
    index: true,
  })
  status: OrderStatus;

  // 'airpay' = paid online. 'balance' = a reseller's client paid from the balance its reseller
  // loaded; the credits come out of the reseller's own stock.
  @Prop({ type: String, enum: ['airpay', 'balance'], default: 'airpay' })
  gateway: 'airpay' | 'balance';

  // Balance purchases: the reseller that sold the messages, and what they cost it.
  @Prop({ type: Types.ObjectId, ref: 'Organization' }) seller?: Types.ObjectId;
  @Prop({ type: Number }) costPaise?: number;

  // Balance purchases: sent by the browser so a double-click buys once.
  @Prop({ type: String }) idempotencyKey?: string;

  // Balance purchases: set once the money is taken, before the credits move.
  @Prop({ type: Date }) balanceDebitedAt?: Date;

  @Prop({ type: OrderBuyerSchema }) buyer?: OrderBuyer;

  // From the gateway
  @Prop() gatewayTxnId?: string;
  @Prop() gatewayStatus?: string;
  @Prop() gatewayMessage?: string;
  @Prop() paymentMode?: string;
  @Prop({ type: Object }) gatewayDetails?: Record<string, any>;

  @Prop({ type: Date }) paidAt?: Date;
  @Prop({ type: String, enum: ['gateway', 'manual', 'balance'] }) paidVia?:
    | 'gateway'
    | 'manual'
    | 'balance';
  @Prop() manualNote?: string;

  // Set once every category's credits are in the wallet.
  @Prop({ type: Date }) creditsAppliedAt?: Date;

  @Prop({ type: Date }) lastCheckedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ organization: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: 1 });
OrderSchema.index(
  { seller: 1, createdAt: -1 },
  { partialFilterExpression: { seller: { $type: 'objectId' } } },
);
OrderSchema.index(
  { organization: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: 'string' } },
  },
);
