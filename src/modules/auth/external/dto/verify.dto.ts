"use strict";

import {IsEnum,IsString, IsUrl, NotEquals } from "class-validator";
import { AvailableAuthMethods } from "../../../../interfaces/types";

export class VerifyTokenDto {
    
    @IsString()
    id: string;

    @IsString()
    token:string;

    // @IsEnum(AvailableAuthMethods,{
    //     message:"Incorrect authentication method"
    // })
    // @NotEquals(AvailableAuthMethods[AvailableAuthMethods.stellar_address])
    // method: AvailableAuthMethods;

    // @IsString({
    //     message:"Incorrect authentication method value"
    // })
    // value:string;

    // @IsUrl()
    // callbackUrl:string;

}