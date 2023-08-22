import { Column, Entity, OneToMany} from "typeorm";
import { AbstractEntity } from "../../../common/abstract.entity";
import { AbstractDto } from "../../../common/dto/AbstractDto";
import { Identity } from "./identity.entity";

@Entity({ name: "sep30_accounts" })
export class Account extends AbstractEntity<AbstractDto> {

    @Column({ nullable: false,unique:true })
    address: string;

    @OneToMany(() => Identity, (identity) => identity.account,{cascade: true})
    identities: Identity[]

    dtoClass = AbstractDto;
}
