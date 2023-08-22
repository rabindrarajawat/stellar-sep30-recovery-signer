import { Global, Module } from '@nestjs/common';
import { FireblocksService } from './fireblocks/fireblocks.service';
import { MessageBirdService } from './messagebird/messagebird.service';
import { FireblocksController } from './fireblocks/fireblocks.controller';

@Global()
@Module({
  providers: [FireblocksService,MessageBirdService],
  exports:[FireblocksService,MessageBirdService],
  controllers: [FireblocksController]
})
export class ExternalModule {}
