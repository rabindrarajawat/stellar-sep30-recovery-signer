import {IsUUID} from 'class-validator';

export class TransactionDto {

    @IsUUID("all",{
        message: "Invalid transaction Id"
    })
    id:string; 
}