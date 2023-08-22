import { Repository } from "typeorm";
import { EntityRepository } from "typeorm/decorator/EntityRepository";
import { Identity } from "../entities/identity.entity";

@EntityRepository(Identity)
export class IdentityRepository extends Repository<Identity> {}
