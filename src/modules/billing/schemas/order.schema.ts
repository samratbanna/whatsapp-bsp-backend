import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order &
  Document & { createdAt: Date; updatedAt: Date };

export enum OrderStatus {
  CREATED = 'created', // checkout form handed to the browser; nothing heard from the gateway yet
  PENDING = 'pending', // gateway says processing
  PAID = 'paid', // confirmed — credits are (or are being) loaded
  FAILED = 'failed', // failed, cancelled, or never completed
}

@Schema({ _id: false })
export class OrderPlanSnapshot {
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) slug: string;
  @Prop({ default: 0 }) transactional: number;
  @Prop({ default: 0 }) promotional: number;
  @Prop({ default: 0 }) authentication: number;
}
const OrderPlanSnapshotSchema = SchemaFactory.createForClass(OrderPlanSnapshot);

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

  @Prop({ type: Types.ObjectId, ref: 'Plan', required: true })
  plan: Types.ObjectId;

  // What was sold, frozen at checkout — later plan edits don't change a past order.
  @Prop({ type: OrderPlanSnapshotSchema, required: true })
  planSnapshot: OrderPlanSnapshot;

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

  @Prop({ default: 'airpay' }) gateway: string;

  @Prop({ type: OrderBuyerSchema }) buyer: OrderBuyer;

  // From the gateway
  @Prop() gatewayTxnId?: string;
  @Prop() gatewayStatus?: string;
  @Prop() gatewayMessage?: string;
  @Prop() paymentMode?: string;
  @Prop({ type: Object }) gatewayDetails?: Record<string, any>;

  @Prop({ type: Date }) paidAt?: Date;
  @Prop({ type: String, enum: ['gateway', 'manual'] }) paidVia?:
    | 'gateway'
    | 'manual';
  @Prop() manualNote?: string;

  // Set once every category's credits are in the wallet.
  @Prop({ type: Date }) creditsAppliedAt?: Date;

  @Prop({ type: Date }) lastCheckedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ organization: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: 1 });
