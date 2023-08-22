import { Repository } from "typeorm";
import { EntityRepository } from "typeorm/decorator/EntityRepository";
import { TransactionEntity } from "../entities/transaction.entity";

@EntityRepository(TransactionEntity)
export class TransactionRepository extends Repository<TransactionEntity> {}
