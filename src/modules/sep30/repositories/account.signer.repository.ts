import { Repository } from "typeorm";
import { EntityRepository } from "typeorm/decorator/EntityRepository";
import { Account } from "../entities/account.entity";
import { AccountSigner } from "../entities/account-signer.entity";

@EntityRepository(AccountSigner)
export class AccountSignerRepository extends Repository<AccountSigner> {}
