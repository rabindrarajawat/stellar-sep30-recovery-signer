import { Injectable } from '@nestjs/common';
import {Networks, Server, StrKey,Transaction, Utils} from 'stellar-sdk';
import * as libphonenumber from 'google-libphonenumber';
import validator from 'validator';
import { Account } from '../entities/account.entity';
import { AccountRepository } from '../repositories/account.repository';
import { Identity } from '../dto/identity';
import { AuthMethodRepository } from '../repositories/auth-method.repository';
import { AuthMethod } from '../entities/auth-method.entity';
import { IdentityRepository } from '../repositories/identity.repository';
import { Identity as IdentityEntity } from '../entities/identity.entity';
import { AccountSigner } from '../entities/account-signer.entity';
import { AccountSignerRepository } from '../repositories/account.signer.repository';
import { ConfigService } from '@nestjs/config';
import { StellarConfig,AvailableAuthMethods } from "../../../interfaces/types";
import {TransactionRepository} from '../repositories/transactions.repository';
import { TransactionEntity } from '../entities/transaction.entity';
import { FireblocksService } from '../../../modules/external/fireblocks/fireblocks.service';
import { Queue } from 'bull';
import { InjectQueue} from '@nestjs/bull';

let stellarConfig:StellarConfig;

@Injectable()
export class Sep30Service {

  server: Server;
  network_passphrase: any;
    
    constructor(private accountRepository:AccountRepository,
      private authMethodRepository:AuthMethodRepository,private identityRepository:IdentityRepository,
      private accountSignerRepository:AccountSignerRepository,private configService: ConfigService,
      private transactionRepository:TransactionRepository,private fireblocksService:FireblocksService,
      @InjectQueue ('sign') private signQueue: Queue,){
      
      stellarConfig = this.configService.get<StellarConfig>('stellar');
      this.network_passphrase = stellarConfig.is_testnet? Networks.TESTNET: Networks.PUBLIC
    }

    async findStellarAccount(publicKey:string):Promise<[any,Account|null]>{

      try {

        const foundAccount = await this.accountRepository.findOne({ where: {address: publicKey},relations:['identities']});

        if (foundAccount){
          return [null,foundAccount]
        }

        return [null,null]
        
      } catch (error) {

        return [error,null]
        
      }

    }

    getNetworkPassPhrase():string{

      return this.network_passphrase;

    }

    validateStellarAccount(account:string):boolean{

    return StrKey.isValidEd25519PublicKey(account)

    }

    validatePhoneNumber(phone_number:string):boolean{

    try {
                        
        const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
        const number = phoneUtil.parseAndKeepRawInput(phone_number);

        if (phoneUtil.isValidNumber(number)){
            return true
        }
        return false;
    } catch (err) {
        return false;
    }

    }

    validateEmail(emailAddress:string):boolean{

    const result =validator.isEmail(emailAddress);

    return result
    }

    validateIdentity(identity:Identity[]):[any,boolean]{

      console.log('the identity '+JSON.stringify(identity))
      
      for (let i=0;i<identity.length;i++){

        for (let j=0;j<identity[i].auth_methods.length;j++){

            const method = identity[i].auth_methods[j];
            const methodType = method.type;
            const methodValue = method.value;

            if (methodType ===AvailableAuthMethods.stellar_address){

              const result = this.validateStellarAccount(methodValue);
              
              if(!result){

                let error = new Error (`Invalid value ${identity[i].auth_methods[j].value} for type ${identity[i].auth_methods[j].type}`)
      
                return [error,false]
      
              
              }
            }

            if (methodType ===AvailableAuthMethods.phone_number){

              const result = this.validatePhoneNumber(methodValue);
        
              if(!result){

                let error = new Error (`Invalid value ${identity[i].auth_methods[j].value} for type ${identity[i].auth_methods[j].type}`)
        
              return [error,false]
        
              } 
            }

            if (methodType ===AvailableAuthMethods.email){

              const result = this.validateEmail(methodValue);
        
              if(!result){
        
                let error = new Error (`Invalid value ${identity[i].auth_methods[j].value} for type ${identity[i].auth_methods[j].type}`)
        
                return [error,false]
        
              }
            }
          
        }
      }

      return [null,null]
    }

    async addAuthMethod(authMethod:AuthMethod):Promise<[any,AuthMethod|null]>{

      try {

          const method = await this.authMethodRepository.save(authMethod);
          return [null,method];
        
      } catch (error) {

        return[error,null]
        
      }

      

      

    }

    async addIdentity(identity:IdentityEntity):Promise<[any,IdentityEntity|null]>{

      try {

          const addedIdentity = await this.identityRepository.save(identity);
          return [null,addedIdentity];
        
      } catch (error) {

        return[error,null]
        
      }

    }

    async findIdentityById(id:string):Promise<[any,IdentityEntity|null]>{

      try {

        const response = await this.identityRepository.findOne({where:{id:id},relations:['account']})

        if (response){
          return [null,response]
        }
  
        return [null,null]
        
      } catch (error) {

        return [error,null]
        
      }

     

    }

    async addAccount(account:Account):Promise<[any,Account|null]>{

      try {

        const addedAccount = await this.accountRepository.save(account);
        return [null,addedAccount];
      
    } catch (error) {

      return[error,null]
      
    }

    }

    async findRecoverySigners():Promise<[any,AccountSigner[]|null]>{

      try {

        const signers = await this.accountSignerRepository.find({
          order:{
            createdAt:"DESC"
          }
        });

        return [null,signers]
        
      } catch (error) {

        return [error,null]
        
      }

      
    }

    async verifyAccountSigner(accountID:string,signer:string){

      this.server = new Server(
        stellarConfig.is_testnet? stellarConfig.horizon:stellarConfig.horizon_public
    );

    try {

        const response = await this.server.loadAccount(accountID);
        const accountSigners:any[] = response.signers;
        let foundSigner = false;

        accountSigners.map((element)=>{

          if(element.key===signer){
            foundSigner =true;
          }

        })

        if (!foundSigner){

          return [null,false]

        }

        return [null, true];

    } catch (error) {
        return [error, null];
    }
    }

    async verifyAuthorizedOperations(accountID:string,xdr:string){

      try {

        const stellarTx = new Transaction(xdr,this.network_passphrase);

        const sourceAccount = stellarTx.source;

        if (accountID!==sourceAccount){

          const error = new Error(`Provided transaction has incorrect source account`);

          throw error

        }

        const operations = stellarTx.operations;

        let validOperation = true;

        // all operations need to have a source account (if available) equal to the source provided accountID
        for (let i=0;i<operations.length;i++){
          
          if (operations[i].source && operations[i].source!==sourceAccount){
            
            validOperation =false;
            break;
          }

        }

        if (!validOperation){

          const error = new Error(`One or more operations source account do not match transaction source account`);

          throw error

        }
        
        return [null,true]
        
      } catch (error) {

        return [error,null]
        
      }

      
    }

    async addTransaction(transaction:TransactionEntity):Promise<[any,TransactionEntity|null]>{

      try {

        const response = await this.transactionRepository.save(transaction);

        return [null,response]
        
      } catch (error) {

        return [error,null]
        
      }
    }

    async findTransactionById(id:string):Promise<[any,TransactionEntity|null]>{

      try {

        const transaction = await this.transactionRepository.findOne({ where: {id: id}});

        if (!transaction){
          return [null,null]
        }

        return [null,transaction]
        
      } catch (error) {

        return [error,null]
        
      }
      

    }

    async findTransactionByFireBlocksId(id:string):Promise<[any,TransactionEntity|null]>{

      try {

        const transaction = await this.transactionRepository.findOne({ where: {fireblocks_id: id}});

        if (!transaction){
          return [null,null]
        }

        return [null,transaction]
        
      } catch (error) {

        return [error,null]
        
      }
      

    }

    async getStellarAccountSigners(stellarAccount:string):Promise<[any,any[]|null]>{

      try {

        const response = await this.server.loadAccount(stellarAccount);
        const accountSigners:any[] = response.signers;
        return [null,accountSigners]
        
      } catch (error) {

        return [error,null]
        
      }
        

    }

    async addTransactionToSigningQueue(transaction:TransactionEntity){

      try {

        await this.signQueue.add('sign',{
            
          transaction:transaction,
          
        })

        this.signQueue.on('completed', function (job) {
          //Job finished we remove it
          job.remove();
     });

        return [null,null]
        
      } catch (error) {
        return [error,null]
      }
      

      
    }

    async addFireblocksWebhookToQueue(webhookData:any){

      try {

        await this.signQueue.add('fireblocks',{
            
          fireblocksWebhookData:webhookData,
          
        })

        this.signQueue.on('completed', function (job) {
          //Job finished we remove it
          job.remove();
     });

        return [null,null]
        
      } catch (error) {
        return [error,null]
      }
      

      
    }

    
    async findAuthenticationMethod(type:string,value:string):Promise<[any,AuthMethod[]|null]>{

      const response = await this.authMethodRepository.find({where:{type:type,value:value},relations:['identity']});

      if (!response.length){

        return [null,null]
      }

      return [null,response]
    }

    async removeAccount(account:Account):Promise<[any,Account|null]>{

      try {

        const response = await this.accountRepository.remove(account);
        return [null,response];
      
    } catch (error) {

      return[error,null]
      
    }

    }


}
