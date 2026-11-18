import { Module } from '@nestjs/common';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';
import { ResellerController } from './reseller.controller';
import { ResellerService } from './reseller.service';
import { ResellerGuard } from './guards/reseller.guard';

@Module({
  imports: [OrganizationsModule, UsersModule, WalletModule],
  controllers: [ResellerController],
  providers: [ResellerService, ResellerGuard],
})
export class ResellerModule {}
