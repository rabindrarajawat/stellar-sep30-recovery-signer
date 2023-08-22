import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientAppConfig,StellarConfig} from '../../../interfaces/types';
import { JwtService } from "@nestjs/jwt";
import { JWTPayloadDto } from '../sep10/dto/JWTPayloadDto';

let clientAppConfig:ClientAppConfig;
let stellarConfig:StellarConfig;

@Injectable()
export class ExternalAuthService {

    constructor(private configService:ConfigService,private jwtService:JwtService){

        clientAppConfig = this.configService.get<ClientAppConfig>('client_app');
        stellarConfig = this.configService.get<StellarConfig>('stellar');

    }

    getClientAppURL(){

        const url = clientAppConfig.url

        return url

    }

    generateJWT(method:string,value:string){

        const now = Math.floor(Date.now() / 1000);

        const payload: JWTPayloadDto = {

            iss: stellarConfig.sep_10_issuer,
            sub: {method:method,value:value},
            aud:stellarConfig.sep_10_audience,
            iat: now,
        };

        return this.jwtService.sign(payload)

    }

}
