import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule,ConfigService } from '@nestjs/config';

import stellar from './config/stellar';
import fireblocks from './config/fireblocks';
import redis from './config/redis';
import queue from './config/queue';
import client_app from './config/client-app';
import messagebird from './config/messagebird';

import { TypeOrmModule } from '@nestjs/typeorm';
import {SnakeNamingStrategy} from './snake-naming.strategy';
import { Sep30Module } from './modules/sep30/sep30.module';
import { ExternalModule } from './modules/external/external.module';
import { AdminModule } from './modules/admin/admin.module';

import { RedisModule} from 'nestjs-redis';
import { QueuesModule } from './modules/queues/queues.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      envFilePath: [process.cwd() + '/' + (process.env.NODE_ENV || '') + '.env'],
      load: [stellar,fireblocks,redis,queue,client_app,messagebird],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
      
        type: "postgres",
        url:`${configService.get('DATABASE_URL')}`,
        entities: [ __dirname+'/modules/**///*.entity{.ts,.js}'],
        synchronize: false,
      // Run migrations automatically,
      // you can disable this if you prefer running migration manually.
        migrationsRun: true,
        migrations: [ __dirname+'/migrations/*{.ts,.js}'],
        cli: {
          // Location of migration should be inside src folder
          // to be compiled into dist/ folder.
          migrationsDir: 'src/migrations',
        },
        logging: configService.get('NODE_ENV') === "development",
        namingStrategy: new SnakeNamingStrategy(),
        ssl:configService.get('NODE_ENV') ==="development"?null:{rejectUnauthorized: false}, 
      }),
      inject: [ConfigService],
    }),
    Sep30Module,
    ExternalModule,
    AdminModule,
    RedisModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('redis'),
      inject:[ConfigService]
    }),
    QueuesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}