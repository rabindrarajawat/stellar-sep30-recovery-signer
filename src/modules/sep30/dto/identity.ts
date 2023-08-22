import {ArrayNotEmpty, IsArray,IsString,ValidateNested} from 'class-validator';
import { Type } from 'class-transformer';
import { AuthMethodDto } from './auth.method';

export class Identity {

    @IsString()
    role:string;

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => AuthMethodDto)
    auth_methods:AuthMethodDto[]
}