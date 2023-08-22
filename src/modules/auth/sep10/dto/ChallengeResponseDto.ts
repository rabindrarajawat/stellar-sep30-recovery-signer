"use strict";
import {IsString} from "class-validator";

export class ChallengeResponseDto {
    
    @IsString()
    transaction: string;

    @IsString()
    network_passphrase:string;

    constructor(transaction: string, network_passphrase: string) {
        this.transaction = transaction;
        this.network_passphrase = network_passphrase;
    }
}
