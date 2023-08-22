import { Repository } from "typeorm";
import { EntityRepository } from "typeorm/decorator/EntityRepository";
import { AuthMethod } from "../entities/auth-method.entity";

@EntityRepository(AuthMethod)
export class AuthMethodRepository extends Repository<AuthMethod> {}
