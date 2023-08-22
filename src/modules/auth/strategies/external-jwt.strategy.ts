import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService} from '@nestjs/config';

@Injectable()
export class ExternalJwtStrategy extends PassportStrategy(Strategy,'external_auth') {
    constructor(
        public readonly configService: ConfigService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromUrlQueryParameter("auth_token"), ExtractJwt.fromAuthHeaderAsBearerToken()]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('stellar.sep_10_signing_key_private'),
            issuer:configService.get<string>('stellar.sep_10_issuer'),
            algorithm:configService.get<string>('stellar.sep_10_signing_alg'),
            audience:configService.get<string>('external_auth.audience')
        });
        
    }

    async validate(payload: any) {
        return payload
    }
}
