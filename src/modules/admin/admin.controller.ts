import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { Keypair, Networks, Transaction } from 'stellar-sdk';

@Controller('admin')
export class AdminController {

    @Get()
    testSign(){

        return "Hi"
    }
}
