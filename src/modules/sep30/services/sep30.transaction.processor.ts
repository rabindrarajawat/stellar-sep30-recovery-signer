import { Process, Processor } from '@nestjs/bull';
import { DoneCallback, Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import {FireblocksService} from '../../external/fireblocks/fireblocks.service';
import * as stellarSDK  from 'stellar-sdk';
import * as fireblocks from 'fireblocks-sdk';
import { Sep30Service } from './sep30.service';
import { TransactionEntity }  from '../entities/transaction.entity';
import { StellarConfig} from '../../../interfaces/types';
import { AccountSigner } from '../entities/account-signer.entity';
import { UtilsService } from '../../../common/utils/utils.service';

let stellarConfig:StellarConfig;
let networkPhrase:stellarSDK.Networks;

@Processor('sign')
export class TransactionProcessorSigner {
 
  constructor(
    private fireblocksService:FireblocksService,
    private configService:ConfigService,
    private sep30Service:Sep30Service
    
  ) {
    stellarConfig = this.configService.get<StellarConfig>('stellar');
    networkPhrase = stellarConfig.is_testnet?stellarSDK.Networks.TESTNET:stellarSDK.Networks.PUBLIC
  }

  @Process('sign')
  async process(job: Job<{ transaction: TransactionEntity}>, done: DoneCallback) {
    
    try {

        const tx = new stellarSDK.Transaction(job.data.transaction.unsigned_stellar_xdr,networkPhrase);

        const sourceAccount = tx.source;

        let recoverySigner:AccountSigner; // this value will never be null after the loop below because the account was previously validated during the request to sign the transaction

        const [signersError,signersResponse] = await this.sep30Service.getStellarAccountSigners(sourceAccount);

        if (signersError){
          done(signersError,null);
          return;
        }

        const [recoverySignerError,recoverySigners] = await this.sep30Service.findRecoverySigners();

        if (recoverySignerError){
          done(recoverySignerError,null);
          return;
        }

        let exitLoops=false;

        for (let i=0;i<signersResponse.length;i++){
          
          for (let j=0;j<recoverySigners.length;j++){

            if (signersResponse[i].key===recoverySigners[j].public_key){
              recoverySigner=recoverySigners[j];
              exitLoops=true;
              break
            }

          }
          if (exitLoops){
            break;
          }
        }

        // create a signable to send to fireblocks for signing..
        const signable =UtilsService.sha256(tx.signatureBase());

        const [fireblocksError,fireblocksResponse] = await this.fireblocksService.signTransaction(signable,recoverySigner.fireblocks_vault_id);

        if (fireblocksError){
          done(fireblocksError,null)
          return;
        }

        const fbTxId = fireblocksResponse.id;
        let status = fireblocksResponse.status;

        let fireblocksTransaction:fireblocks.TransactionResponse;

        const [error,updatedTx] = await this.fireblocksService.getTransactionById(fbTxId);

        if (error){
          done(error,null)
        }

        fireblocksTransaction= updatedTx;
        job.data.transaction.fireblocks_id = fbTxId

        const [saveTxError,saveTx] = await this.sep30Service.addTransaction(job.data.transaction);

        if (saveTxError){
          done(saveTxError,null)
        }

        // while(status!=fireblocks.TransactionStatus.COMPLETED && status != fireblocks.TransactionStatus.FAILED){

        //   const [error,updatedTx] = await this.fireblocksService.getTransactionById(fbTxId);

        //   if (error){
        //     done(error,null)
        //     break;
        //   }
        //   status = updatedTx.status;

        //   fireblocksTransaction = updatedTx;
        //   await new Promise(r => setTimeout(r, 5000));
          
        // }

        // try {


        //   const signedMessageSignature = updatedTx.signedMessages[0].signature.fullSig; // fireblocks signature is in hex format
          
        //   // converting from hex to base64
        //   const signature = (source => btoa(
        //     String.fromCharCode(
        //       ...source
        //       .match(/.{2}/g)
        //       .map(c => parseInt(c, 16))
        //     )
        //   ))(signedMessageSignature)

        //   job.data.transaction.signature = signature;
        //   job.data.transaction.status = TransactionStatus.SIGNING_COMPLETED;

        //   console.log(`transaction signing for id ${job.data.transaction.id} completed`);

        //   const [saveTxError,saveTx] = await this.sep30Service.addTransaction(job.data.transaction);

        //   if (saveTxError){
        //     done(saveTxError,null)
        //   }
        
        // } catch (error) {

        //   done (error,null)
          
        // }

        done(null,saveTx.id)

        

    } catch (err) {

      done(err);
      return;
    }
  }

  @Process('fireblocks')
  async fireblocks(job: Job<{ fireblocksWebhookData: any}>, done: DoneCallback){

    const data = job.data.fireblocksWebhookData;
    const txId = data.id;
    const [error,foundTx] = await this.sep30Service.findTransactionByFireBlocksId(txId);

    if (error){
      done(error,null);
      return;
    }

    if (!foundTx){
        done(error,null);
        return;

    }

    const signedMessageSignature = data.signedMessages[0].signature.fullSig; // fireblocks signature is in hex format
          
    // converting from hex to base64
    const signature = (source => btoa(
      String.fromCharCode(
        ...source
        .match(/.{2}/g)
        .map(c => parseInt(c, 16))
      )
    ))(signedMessageSignature)

    foundTx.status = data.status;
    foundTx.signature = signature;

    const [updatedTxError,updatedTx] = await this.sep30Service.addTransaction(foundTx);

    if (updatedTxError){

      done(error,null);
      return;

    }

    console.log(`transaction signing for id ${foundTx.id} completed`);

    done(null,updatedTx)

  }

};