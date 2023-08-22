import { Injectable } from '@nestjs/common';
import {CreateTransactionResponse, DestinationTransferPeerPath, FireblocksSDK, GenerateAddressResponse, PeerType, RawMessage, RawMessageData,TransactionArguments, TransactionFilter, TransactionOperation, TransactionResponse, TransferPeerPath, VaultAccountResponse, IOneTimeAddress } from "fireblocks-sdk";
import { ConfigService } from '@nestjs/config';
import {Networks } from 'stellar-sdk';
import { FireblocksConfig, StellarConfig } from '../../../interfaces/types';

let fireblocksConfig:FireblocksConfig;
let stellarConfig:StellarConfig;
let fireblocks:FireblocksSDK;
let networkPhrase:Networks;


@Injectable()
export class FireblocksService {

    constructor(private configService:ConfigService){

        fireblocksConfig = this.configService.get<FireblocksConfig>('fireblocks');
        stellarConfig = this.configService.get<StellarConfig>('stellar');
        
        const privateKey = Buffer.from(fireblocksConfig.api_secret, 'base64').toString();

        fireblocks = new FireblocksSDK(privateKey, fireblocksConfig.api_signer_key);

        networkPhrase = stellarConfig.is_testnet?Networks.TESTNET:Networks.PUBLIC
    }

    async getSupportedAssets(){

        try {

            const supportedAssets = await fireblocks.getSupportedAssets();

            return [null,supportedAssets]
            
        } catch (error) {

            return [error,null]
            
        }
    }

    async listVaults(){

        try {

            const vaults = await fireblocks.getVaultAccountsWithPageInfo({assetId:`${fireblocksConfig.xlm_asset_id}`})
            
            return [null,vaults]
            
        } catch (error) {

         

            return [error,null]
            
        }

    }

    async generateVault(name:string):Promise<[any|null,VaultAccountResponse|null]>{

        try {

            const vaultAccount = await fireblocks.createVaultAccount(name);
            
            return [null,vaultAccount]
            
        } catch (error) {
            
            return [error,null]
            
        }
        
        
    }

    async generateStellarAddressInVault(vaultId:string){

        try {

            const assetId = fireblocksConfig.xlm_asset_id;

            const vaultAsset = await fireblocks.createVaultAsset(vaultId, assetId);

            return [null,vaultAsset]
            
        } catch (error) {

            return [error,null]
            
        }

    }

    // async findVaultByID(id:string):Promise<[any|null,VaultAccountResponse|null]>{

    //     try {

    //         const vaultAccount = await fireblocks.getVaultAccountById(id);
            
    //         return [null,vaultAccount]
            
    //     } catch (error) {
    //         this.sentry_client.instance().captureException(error);
    //         return [error,null]
            
    //     }
        
        
    // }

    
    async signTransaction(tx:Buffer,vaultId:string):Promise<[any,CreateTransactionResponse|null]>{

       /**
       * Prep Frb raw signature
       */

      const rawMessage:RawMessage = {
        content:tx.toString('hex')
      }

      const peerPath:TransferPeerPath ={
        type:PeerType.VAULT_ACCOUNT,
        id:vaultId
      }

      const rawMessageData:RawMessageData ={
          messages:[rawMessage],
      }

      const rawTransaction: TransactionArguments = {
          assetId:fireblocksConfig.xlm_asset_id,
          operation:TransactionOperation.RAW,
          source:peerPath,
          extraParameters:{rawMessageData}
      }

      try {

        const result = await fireblocks.createTransaction(rawTransaction);

        return [null,result]
                
                
        } catch (error) {

            return[error,null]    
         }
    }  

    async getTransactionById (id:string):Promise<[any,TransactionResponse|null]>{

        try {
            const tx = await fireblocks.getTransactionById(id);
            return [null,tx]
            
        } catch (error) {
            return [error,null]
            
        }
    
    }

    async getTrasanctions(vaultId:string){

        const filter:TransactionFilter = {

            sourceType:PeerType.VAULT_ACCOUNT,
            sourceId:vaultId,
            destType:PeerType.VAULT_ACCOUNT,
            destId:vaultId
        }

        try {

            const transactions = await fireblocks.getTransactions(filter);

            return [null,transactions]
            
        } catch (error) {

            return [error,null]
            
        }

    }
    
}
