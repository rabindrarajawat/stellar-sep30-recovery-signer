"use strict";

import { IsStellarXDR } from "../../../decorators/validators.decorator";

export class Sep30TransactionSignDto {
    
    @IsStellarXDR("transaction", {
        message: "Incorrect Stellar XDR",
    })
    transaction: string;
}
