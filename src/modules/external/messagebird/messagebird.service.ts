"use strict";

import {Injectable} from "@nestjs/common";
import { ConfigService } from '@nestjs/config';

import bent from 'bent';

interface MessageBirdConfig {

  originator:string,
  template_en: string,
  timeout:string,
  apiKey:string
  api_url:string;

}

let msbConfig:MessageBirdConfig;


@Injectable()
export class MessageBirdService {
    
    constructor(private configService:ConfigService){
        
        msbConfig = this.configService.get<MessageBirdConfig>('messagebird');
    }

    /**https://developers.messagebird.com/api/verify/#request-a-verify
     * Method that sends a verification code to the provided phone number
     * @param phoneNumber: the phone number to verify   
     * @param language: the language in which the message is sent (only Spanish and English supported)
     */

    async getVerificationPhoneToken(phoneNumber:string):Promise<any>{

        const header= {
            "Authorization":`AccessKey ${msbConfig.apiKey}`,
            "Content-Type":`application/json`
        }

        const post = bent(`${msbConfig.api_url}`, 'POST', 'json', 201);
        
        let originator = msbConfig.originator;
        let template = msbConfig.template_en;
        let timeout =msbConfig.timeout;

        const data = {
                recipient:phoneNumber,
                originator:originator,
                template: template,
                timeout : timeout,
                type:"sms" 
        }

        try {

            const response = await post(`/verify`, data,header);

            return [null,response]
            
        } catch (error) {

            return [error,null]
            
        } 
    };

    /** https://developers.messagebird.com/api/verify/#verify-a-token
     * Method to verify the code sent to the mobile phone
     * @param tokenId: A unique random ID which is created on the MessageBird platform and is returned upon creation of the object 
     * @param token: Token sent to the mobile phone
     */

    async verify2FAToken (tokenId:string, token:string){

        const header= {
            "Authorization":`AccessKey ${msbConfig.apiKey}`,
            "Content-Type":`application/json`
        }

        const get= bent(`${msbConfig.api_url}`,'GET','json',200);

        try {

            const response = await get(`/verify/${tokenId}?token=${token}`, null,header);

            return [null,response]
            
        } catch (error) {

            return [error,null]
            
        } 

    } 

}
