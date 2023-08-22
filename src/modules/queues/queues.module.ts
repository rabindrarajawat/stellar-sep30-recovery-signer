import { Module,Global } from '@nestjs/common';
import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TransactionProcessorSigner } from '../sep30/services/sep30.transaction.processor';

const bullModuleFactory = (config: ConfigService): BullModuleOptions => {
    return {
      redis: config.get<string>('redis.url') as any,
      prefix:config.get<string>('redis.key_prefix') as any,
    };
};

const BullQueueModule = BullModule.registerQueueAsync(
    {
      name: 'sign',
      imports: [ConfigModule],
      useFactory: bullModuleFactory,
      inject: [ConfigService],
    },

);

@Global()
@Module({
    imports: [
        BullQueueModule,
      ],
      exports: [
        BullQueueModule,
      ],
      providers:[TransactionProcessorSigner]
})
export class QueuesModule {}
