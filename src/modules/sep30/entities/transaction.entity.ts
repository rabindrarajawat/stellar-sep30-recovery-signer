
import { Column, Entity} from "typeorm";
import { AbstractEntity } from "../../../common/abstract.entity";
import { AbstractDto } from "../../../common/dto/AbstractDto";

@Entity({ name: "sep30_transactions" })
export class TransactionEntity extends AbstractEntity<AbstractDto> {

    @Column({
        nullable: false,
        type: "text",
        //enum: TransactionStatus
    })
    status: string//TransactionStatus;

    //The base64-encoded XDR blob that can be deserialized to inspect and sign the encoded transaction
    @Column({
        nullable: false,
        type: "text",
    })
    unsigned_stellar_xdr: string;

    //The base64 encoded signature that is the result of the server signing a transaction.
    @Column({
        nullable: true,
        type: "text"
    })
    signature: string;

    @Column({
        nullable: true,
        type: "text",
    })
    fireblocks_id: string;

    dtoClass = AbstractDto;
}
