import { Repository } from "typeorm";
import { EntityRepository } from "typeorm/decorator/EntityRepository";
import { Account } from "../entities/account.entity";

@EntityRepository(Account)
export class AccountRepository extends Repository<Account> {}
