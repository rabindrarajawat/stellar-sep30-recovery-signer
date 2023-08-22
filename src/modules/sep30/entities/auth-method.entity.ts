import { AvailableAuthMethods } from "../../../interfaces/types";
import { Column, Entity, Index, ManyToOne} from "typeorm";
import { AbstractEntity } from "../../../common/abstract.entity";
import { AbstractDto } from "../../../common/dto/AbstractDto";
import { Identity } from "./identity.entity";


@Entity({ name: "sep30_auth_methods" })
@Index(["type", "value","identity"], { unique: true })
export class AuthMethod extends AbstractEntity<AbstractDto> {

    @Column({
        nullable: false,
        type: "text",
        // enum: AvailableAuthMethods
    })
    type: string;

    @Column({
        nullable: false,
        type: "text",
    })
    value: string;

    @ManyToOne(() => Identity, (identity) => identity.auth_methods,{
        onDelete:'CASCADE'
    })
    identity: Identity

    dtoClass = AbstractDto;
}
