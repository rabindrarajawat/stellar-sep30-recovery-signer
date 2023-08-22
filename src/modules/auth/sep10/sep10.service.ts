import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Keypair, Networks, Server, Utils,InvalidSep10ChallengeError,StellarTomlResolver,Transaction} from "stellar-sdk";
import { JWTPayloadDto } from "./dto/JWTPayloadDto";
import { ConfigService } from '@nestjs/config';
import {ChallengeResponseDto} from "./dto/ChallengeResponseDto";
import { AvailableAuthMethods, StellarConfig } from "../../../interfaces/types";

let stellarConfig:StellarConfig;

@Injectable()
export class Sep10Service {

    server: Server;
    network_passphrase: any;


    constructor(
        private configService: ConfigService,
        private jwtService: JwtService
    ) {

        stellarConfig = this.configService.get<StellarConfig>('stellar');

      
        this.network_passphrase = stellarConfig.is_testnet? Networks.TESTNET: Networks.PUBLIC;
    }

    /** Method for challenge request
     *  @see [SEP0010: Stellar Web Authentication](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md).
     * 
     * @param account: the client Stellar accountID;
     * 
     * (optional) The memo to attach to the challenge transaction. Only permitted if a Stellar account (G...) is used. The memo must be of type id. Other memo types are not supported. See the Memo section for details.
     * @param memo: 
     * 
     * (optional) a Home Domain. Servers that generate tokens for multiple Home Domains can use this parameter to identify 
     *  which home domain the Client hopes to authenticate with. 
     *  If not provided by the Client, the Server should assume a default for backwards compatibility with older Clients.
     * @param home_domain:
     * 
     * (optional) a Client Domain. 
     * Supplied by Clients that intend to verify their domain in addition to the Client Account. 
     * Servers should ignore this parameter if the Server does not support Client Domain verification, 
     * or the Server does not support verification for the specific Client Domain included in the request.
     * @param client_domain
     * 
     */


    async generateChallenge(account: string,memo?:string,home_domain?:string,client_domain?:string) {

        let clientSigningKey = undefined;

        if (client_domain){

            try {

                const toml = await StellarTomlResolver.resolve(client_domain);
                clientSigningKey = toml.SIGNING_KEY;
                
            } catch (error) {

                return [error,null]
                
            }
            
        }
        
        const serverKeyPair = Keypair.fromSecret(stellarConfig.sep_10_signing_key_private);

        const challenge = Utils.buildChallengeTx(
            serverKeyPair,
            account,
            home_domain?home_domain:stellarConfig.sep_10_issuer,
            900,
            this.network_passphrase,
            stellarConfig.sep_10_web_auth_domain,
            memo,
            client_domain?client_domain:undefined,
            clientSigningKey
        );
       
        const response = new ChallengeResponseDto(challenge,this.network_passphrase)

        return [null,response]
        
    }

    /**
     * @see [SEP0010: Stellar Web Authentication](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md).
     * @param challengeTx:the signed challenge by the client 
     */

     verifyChallenge = (challengeTx: string)=> {

        try {

            const readChallengeTxResponse = Utils.readChallengeTx(
                challengeTx,
                stellarConfig.sep_10_signing_key,
                this.network_passphrase,
                stellarConfig.sep_10_issuer,
                stellarConfig.sep_10_web_auth_domain
            );

            return [null,readChallengeTxResponse];
            
        } catch (error) {

            return [error,null] 
        }

     }

    async getToken(challengeTx: string) {

        /**
         * readChallengeTx reads a SEP 10 challenge transaction and returns the decoded transaction and client account ID contained within.
            It also verifies:
            1.Verifies that the tx is not a bump Transaction
            2.verify sequence number
            3.verify transaction source is the server account
            4.verify operations
            5. verify transaction has been signed by the server.
            6. verify timebounds
            7. verify base64
            8. verify homeDomains
            9. verify any subsequent operations are manage data ops and source account is the server
           NOTE: It does not verify that the transaction has been signed by the client or that any signatures other than the server's on the transaction are valid. Use one of the following functions to completely verify the transaction:
         */
        const [challengeError,verifyChallengeResponse] = this.verifyChallenge(challengeTx);
        
        if (challengeError) {

            let error:InvalidSep10ChallengeError = challengeError

            throw new HttpException(
                { error: error.name, message: error.message },
                HttpStatus.BAD_REQUEST
            );
        }

        const [accountLoadError, response] = await this.loadAccount(verifyChallengeResponse.clientAccountID);

        // get all the transaction signers 

        const tx = new Transaction(challengeTx,this.network_passphrase);
        
        const txSigners = new Set<string>()

        txSigners.add(tx.source);

        //2. Search for signers of the operations
        tx.operations.forEach(op => {

            if(op.source){
                txSigners.add(op.source)
            }

        });

        const [operation, ...operations] = tx.operations;

        const subsequentOperations:any = operations // somehow the operations object does not have a type. Therefore assing it to a any object

        let client_domain:any; 
        
        for (const op of subsequentOperations) {

            if (op.name==='client_domain'){

                client_domain = (op.value).toString('utf8');  
            }
        }

        /**
         * Error means the account is not created yet in the Stellar Network
         * we then need to verify that the tx is signed by the correct account 
         * master key
         */    

        if (accountLoadError) {

            try {

                Utils.verifyChallengeTxSigners(
                    challengeTx,
                    stellarConfig.sep_10_signing_key,
                    this.network_passphrase,
                    [verifyChallengeResponse.clientAccountID, stellarConfig.sep_10_signing_key],
                    stellarConfig.sep_10_issuer, // this is the home_domain
                    stellarConfig.sep_10_web_auth_domain // this is the webauthdomain
                );

            } catch (signerCheckError) {

                let error:InvalidSep10ChallengeError = signerCheckError

                throw new HttpException(
                    { error: error.name, message: error.message },
                    HttpStatus.BAD_REQUEST
                );
                
            }
        }  

        /**
         * If account exists, we check that the account complies with the high threshold
         */
        
        if (response) {
            
            const med_threshold = response.thresholds.high_threshold;
            const signers = response.signers;
            
            try {

                Utils.verifyChallengeTxThreshold(
                    challengeTx,
                    stellarConfig.sep_10_signing_key,
                    this.network_passphrase,
                    med_threshold,
                    signers,
                    stellarConfig.sep_10_issuer,
                    stellarConfig.sep_10_web_auth_domain
                    );
            } catch (challengeTxThresholdError) {

                let error:InvalidSep10ChallengeError = challengeTxThresholdError

                throw new HttpException(
                    { error: error.name, message: error.message },
                    HttpStatus.BAD_REQUEST
                );
                
            }
                
        }

    return { token: this.generateSep10Token(verifyChallengeResponse.clientAccountID,verifyChallengeResponse.memo,client_domain) };
            
    }

    async loadAccount(accountID: string) {
        this.server = new Server(
            stellarConfig.is_testnet
                ? stellarConfig.horizon
                : stellarConfig.horizon_public
        );

        try {
            const response = await this.server.loadAccount(accountID);

            return [null, response];
        } catch (error) {
            return [error, null];
        }
    }

    generateSep10Token(clientAccountID:string,memo?:string,clientDomain?:string){

        const now = Math.floor(Date.now() / 1000);

        const payload: JWTPayloadDto = {

            iss: stellarConfig.sep_10_issuer,
            sub: {
                method:AvailableAuthMethods.stellar_address,
                value:memo?`${clientAccountID}:${memo}`:clientAccountID
            },
            aud:stellarConfig.sep_10_audience,
            iat: now,
            client_domain:clientDomain
        };
        
        return this.jwtService.sign(payload)

    }

}
