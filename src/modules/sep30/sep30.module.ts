import { Global, Module } from '@nestjs/common';
import { Sep30Service } from './services/sep30.service';
import { Sep30Controller } from './controllers/sep30.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import {AccountRepository} from "./repositories/account.repository";
import { AuthMethodRepository } from './repositories/auth-method.repository';
import { IdentityRepository } from './repositories/identity.repository';
import { AccountSignerRepository } from './repositories/account.signer.repository';
import { TransactionRepository } from './repositories/transactions.repository';

@Global()
@Module({
  imports:[
    TypeOrmModule.forFeature(
      [AccountRepository,AuthMethodRepository,IdentityRepository,AccountSignerRepository,TransactionRepository]),
  ],
  providers: [Sep30Service],
  controllers: [Sep30Controller],
  exports:[Sep30Service]
})
export class Sep30Module {
}
