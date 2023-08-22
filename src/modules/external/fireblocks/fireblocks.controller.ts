import { Body, Controller, Headers, HttpCode, HttpStatus, Post, Request } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FireblocksConfig, StellarConfig } from 'src/interfaces/types';
import * as fireblocks from 'fireblocks-sdk';
import { Sep30Service } from 'src/modules/sep30/services/sep30.service';

let stellarConfig:StellarConfig;
let fireblocksConfig:FireblocksConfig

enum WebhookType {

    TRANSACTION_CREATED='TRANSACTION_CREATED',
    TRANSACTION_STATUS_UPDATED='TRANSACTION_STATUS_UPDATED',
    TRANSACTION_APPROVAL_STATUS_UPDATED='TRANSACTION_APPROVAL_STATUS_UPDATED',
    VAULT_ACCOUNT_ADDED = 'VAULT_ACCOUNT_ADDED',
    VAULT_ACCOUNT_ASSET_ADDED='VAULT_ACCOUNT_ASSET_ADDED',
    INTERNAL_WALLET_ASSET_ADDED='INTERNAL_WALLET_ASSET_ADDED',
    EXTERNAL_WALLET_ASSET_ADDED='EXTERNAL_WALLET_ASSET_ADDED',
    EXCHANGE_ACCOUNT_ADDED='EXCHANGE_ACCOUNT_ADDED',
    FIAT_ACCOUNT_ADDED='FIAT_ACCOUNT_ADDED',
    NETWORK_CONNECTION_ADDED='NETWORK_CONNECTION_ADDED',
  
  }

@Controller('fireblocks')
export class FireblocksController {

    constructor(private configService:ConfigService,private sep30Service:Sep30Service){
        stellarConfig = this.configService.get<StellarConfig>('stellar');
        fireblocksConfig = this.configService.get<FireblocksConfig>('fireblocks');
    }

    @Post('/')
    @HttpCode(200)
    async handleWebhook(@Body() payload:any,@Headers('x-webhook-secret') jwt:string,@Headers('Fireblocks-Signature') signature:string){

        const webhookType = payload.type;
        const data = payload.data;

        if (signature){
            console.log('the signature ',signature);
        }
        
        if (jwt){
            console.log('the jwt ',jwt);
        }
    
        console.log("printing payload: ",payload);

        if (webhookType===WebhookType.TRANSACTION_STATUS_UPDATED && data.status===fireblocks.TransactionStatus.COMPLETED){

            const [queueError, queueResponse] = await this.sep30Service.addFireblocksWebhookToQueue(data);

            if (queueError){
                // before this return we will need to add sentry errors
                return HttpStatus.OK;

            }

        }

        return HttpStatus.OK;

    }

}
