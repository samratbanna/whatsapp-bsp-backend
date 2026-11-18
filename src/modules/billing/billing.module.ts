import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { BillingService } from './billing.service';
import { AirpayService } from './gateways/airpay.service';
import {
  AdminBillingController,
  AirpayCallbackController,
  BillingController,
} from './billing.controller';
import { PlansModule } from '../plans/plans.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    PlansModule,
    OrganizationsModule,
    UsersModule,
    WalletModule,
  ],
  controllers: [
    BillingController,
    AirpayCallbackController,
    AdminBillingController,
  ],
  providers: [BillingService, AirpayService],
})
export class BillingModule {}
