import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Flow, FlowSchema, FlowSession, FlowSessionSchema } from './schemas/flow.schema';
import { FlowBuilderService } from './flow-builder.service';
import { FlowBuilderController } from './flow-builder.controller';
import { FlowExecutor } from './executors/flow.executor';
import { WabaModule } from '../waba/waba.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Flow.name, schema: FlowSchema },
      { name: FlowSession.name, schema: FlowSessionSchema },
    ]),
    WabaModule,
  ],
  controllers: [FlowBuilderController],
  providers: [FlowBuilderService, FlowExecutor],
  exports: [FlowBuilderService, FlowExecutor],
})
export class FlowBuilderModule {}
