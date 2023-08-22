import { ArrayNotEmpty, IsArray, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';
import { Identity } from "./identity";

export class CreateAccountDto {
    
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => Identity)
    identities:Identity[]

}