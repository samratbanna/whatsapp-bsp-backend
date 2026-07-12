import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiAgent, AiAgentSchema } from './schemas/ai-agent.schema';
import { AiAgentsService } from './ai-agents.service';
import { AiAgentsController } from './ai-agents.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiAgent.name, schema: AiAgentSchema },
    ]),
  ],
  controllers: [AiAgentsController],
  providers: [AiAgentsService],
  exports: [AiAgentsService],
})
export class AiAgentsModule {}
