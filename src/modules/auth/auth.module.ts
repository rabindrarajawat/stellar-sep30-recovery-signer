import { Module } from '@nestjs/common';
import { ConfigModule,ConfigService} from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import {Sep10JwtStrategy} from './strategies/sep10-jwt.strategy';
import { ExternalJwtStrategy } from './strategies/external-jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { Sep10Controller } from './sep10/sep10.controller';
import { Sep10Service } from './sep10/sep10.service';
import { ExternalAuthService } from './external/external.service';
import { ExternalController } from './external/external.controller';
import { MessageBirdService } from '../external/messagebird/messagebird.service';

@Module({
    imports: [
              ConfigModule,
              PassportModule,
              JwtModule.registerAsync({
                imports: [ConfigModule],
                useFactory: async (configService: ConfigService) => ({
                  secret: configService.get<string>('stellar.sep_10_signing_key_private'),
                  signOptions: { expiresIn: '6h' },
                }),
                inject: [ConfigService],
              }),
              
    ],
    providers: [Sep10JwtStrategy,ExternalJwtStrategy,Sep10Service, ExternalAuthService,MessageBirdService],
    exports: [PassportModule,Sep10Service,ExternalAuthService,MessageBirdService],
    controllers: [Sep10Controller, ExternalController],
})
export class AuthModule {

}
