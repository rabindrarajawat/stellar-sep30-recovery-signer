"use strict";

import { IsEnum,IsString,NotEquals } from "class-validator";
import { AvailableAuthMethods } from "../../../../interfaces/types";

export class ExternalAuthDto {
    
    @IsEnum(AvailableAuthMethods,{
        message:"Incorrect authentication method"
    })
    @NotEquals(AvailableAuthMethods[AvailableAuthMethods.stellar_address])
    method: AvailableAuthMethods;

    @IsString({
        message:"Incorrect authentication method value"
    })
    value:string;

}
