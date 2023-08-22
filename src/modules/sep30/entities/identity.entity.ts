import { AuthMethod } from "./auth-method.entity";
import { Column, Entity, ManyToOne, OneToMany} from "typeorm";
import { AbstractEntity } from "../../../common/abstract.entity";
import { AbstractDto } from "../../../common/dto/AbstractDto";
import { Account } from "./account.entity";

@Entity({ name: "sep30_identities" })
export class Identity extends AbstractEntity<AbstractDto> {

    @Column({ nullable: false})
    role: string;

    @ManyToOne(() => Account, (account) => account.identities,{
        onDelete:"CASCADE"
    })
    account: Account

    @OneToMany(() => AuthMethod, (authMethod) => authMethod.identity,{cascade: true})
    auth_methods: AuthMethod[]

    dtoClass = AbstractDto;
}
