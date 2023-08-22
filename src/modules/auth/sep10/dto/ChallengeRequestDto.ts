"use strict";
import { ApiOperation, ApiProperty, ApiPropertyOptional, ApiQuery, ApiTags } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional} from "class-validator";

import { IsStellarAccount,IsSep10Memo } from "../../../../decorators/validators.decorator";


export class ChallengeRequestDto {
    
    @ApiProperty({
        example:`GBF4GNLQGMJVLCYEKGCEYF6TNKZSOXRL7WRLZG2IKFG2XFOJY2JWETAX`,
        description:`The Client stellar account (G...) that the Client wishes to authenticate with. Muxed account (M...) are currently not supported`
    })
    @IsStellarAccount("account", {
        message: "Stellar account is not valid!",
    })
    account: string;

    @ApiPropertyOptional({
        example:`9223372036854775808`,
        description:`The memo to attach to the challenge transaction. Only permitted if a Stellar account (G...) is used. The memo must be of type id. Other memo types are not supported`
    })
    @IsNotEmpty()
    @IsOptional()
    @IsSep10Memo("memo", {
        message: "Invalid 'memo' value. Expected a 64-bit integer.",
    })
    memo: string;

    // @ApiPropertyOptional({
    //     description:`a Home Domain. Servers that generate tokens for multiple Home Domains can use this parameter to identify which home domain the Client hopes to authenticate with. If not provided by the Client, the Server should assume a default for backwards compatibility with older Clients`
    // })
    @IsNotEmpty()
    @IsOptional()
    home_domain?:string;

    @ApiPropertyOptional({
        example:`orunpay.com`,
        description:`The domain to verify the client in addition to the stellar account`
    })
    @IsNotEmpty()
    @IsOptional()
    client_domain?:string;

}
