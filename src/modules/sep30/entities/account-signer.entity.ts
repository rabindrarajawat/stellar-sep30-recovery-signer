import { Column, Entity} from "typeorm";
import { AbstractEntity } from "../../../common/abstract.entity";
import { AbstractDto } from "../../../common/dto/AbstractDto";

@Entity({ name: "sep30_account_signers" })
export class AccountSigner extends AbstractEntity<AbstractDto> {

    @Column({ nullable: false,unique:true })
    public_key: string;

    @Column({ nullable: true})
    fireblocks_vault_id: string;

    dtoClass = AbstractDto;
}
