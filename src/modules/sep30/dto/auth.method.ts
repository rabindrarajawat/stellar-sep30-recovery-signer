import {IsEnum,IsNotEmpty,IsString} from 'class-validator';
import { AvailableAuthMethods } from '../../../interfaces/types';

export class AuthMethodDto {

    @IsEnum(AvailableAuthMethods,{
        each: true,
        message: "incorrect auth_method",
    })
    type:AvailableAuthMethods;

    @IsString()
    @IsNotEmpty()
    value:string
}