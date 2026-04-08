import { Global, Module } from '@nestjs/common';
import { MetaApiService } from './services/meta-api.service';

@Global()
@Module({
  providers: [MetaApiService],
  exports: [MetaApiService],
})
export class CommonModule {}
