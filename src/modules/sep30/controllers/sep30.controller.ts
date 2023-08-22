import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AvailableAuthMethods, TransactionStatus } from '../../../interfaces/types';
import { CreateAccountDto } from '../dto/create-account.dto';
import { TransactionDto } from '../dto/get.transaction.dto';
import { Sep30TransactionSignDto } from '../dto/sign.transaction.dto';
import { Account } from '../entities/account.entity';
import { AuthMethod } from '../entities/auth-method.entity';
import { Identity } from '../entities/identity.entity';
import { TransactionEntity } from '../entities/transaction.entity';
import { Sep30Service } from '../services/sep30.service';
import { UpdateAccountDto } from '../dto/update-account.dto';

@UseGuards(AuthGuard(['auth']))
@Controller('sep30')
export class Sep30Controller {

  constructor(private readonly sep30Service: Sep30Service) { }

  @Post('/accounts/:address')
  @HttpCode(200)

  async create(@Param() params: any, @Body() createAccountDto: CreateAccountDto, @Request() req: any) {

    /**VALIDATIONS */

    const address = params.address;

    // 1. Parameter provided needs to be a Stellar Address
    const isStellarAddress = this.sep30Service.validateStellarAccount(address);

    if (!isStellarAddress) {

      throw new HttpException(

        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: `Missing Stellar account in Url parameter`
        },
        HttpStatus.BAD_REQUEST
      );

    }

    const method = req.user.sub.method;
    const value = req.user.sub.value;

    if (method === AvailableAuthMethods.stellar_address) {

      const userInToken: string = value;
      const stellarSep10Account = userInToken.split(':')[0];
      const stellarSep10MemoUser = userInToken.split(':')[1];

      // 2. No support yet for Stellar hosted accounts
      if (stellarSep10MemoUser) {

        throw new HttpException(

          {
            statusCode: HttpStatus.BAD_REQUEST,
            error: `Stellar hosted accounts are not supported`
          },
          HttpStatus.BAD_REQUEST
        );

      }

      // 3. The stellar account provided in the JWT token needs to be equal to the stellar account being registered
      if (stellarSep10Account !== address) {

        throw new HttpException(

          {
            statusCode: HttpStatus.BAD_REQUEST,
            error: `Stellar account in JWT token is not the same as the Stellar account been registered`
          },
          HttpStatus.BAD_REQUEST
        );

      }

    }

    const [foundAccountError, foundStellarAccount] = await this.sep30Service.findStellarAccount(address);

    if (foundAccountError) {

      throw new HttpException(

        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `We have experienced an error`
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    };

    // 4. The account should not be already registered
    if (foundStellarAccount) {

      throw new HttpException(

        {
          statusCode: HttpStatus.CONFLICT,
          error: `Stellar account is already registered`
        },
        HttpStatus.CONFLICT
      )
    };
    
    const indentities = createAccountDto.identities;

    const [error, validIdentities] = this.sep30Service.validateIdentity(indentities);

    if (error) {

      throw new HttpException(

        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }

    /**END OF VALIDATIONS */

    // Saving account,identities and authMethods

    const account = new Account();
    account.address = address;

    const identityArray: Identity[] = [];

    for (let i = 0; i < indentities.length; i++) {

      const identity = new Identity();
      identity.role = indentities[i].role;
      const authMethods: AuthMethod[] = [];

      for (let j = 0; j < indentities[i].auth_methods.length; j++) {

        const authMethod = new AuthMethod();
        authMethod.type = indentities[i].auth_methods[j].type;
        authMethod.value = indentities[i].auth_methods[j].value;
        authMethods.push(authMethod);

        // const [authMethodError,authMethoResponse] = await this.sep30Service.addAuthMethod(authMethod);

        // if (authMethodError){

        //   throw new HttpException(

        //     {
        //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        //       error: `We have experienced an error`
        //     },
        //     HttpStatus.INTERNAL_SERVER_ERROR
        //     )
        // }

        //     newIdentity=authMethoResponse.identity

        //     //authMethods.push(authMethoResponse);
        // }

        // identity.auth_methods = authMethods;



        // identityArray.push(addedIdentity);

      }

      identity.auth_methods = authMethods;

      identityArray.push(identity);
    }

    account.identities = identityArray;

    // since we are using cascade, identity and authMethods will also be saved when saving the account
    const [addedAccountError, addedAccountResponse] = await this.sep30Service.addAccount(account);

    if (addedAccountError) {

      throw new HttpException(

        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `We have experienced an error`
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )

    }

    const [signersError, signers] = await this.sep30Service.findRecoverySigners();

    if (signersError) {

      throw new HttpException(

        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `We have experienced an error`
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )

    }

    const signersArrayResponse = [];
    const identityArrayResponse = [];

    signers.map((element) => {

      const signer = {
        key: element.public_key
      }

      signersArrayResponse.push(signer)



    })

    identityArray.map((element) => {

      const identity = {
        role: element.role
      }

      identityArrayResponse.push(identity);

    })

    const response = {

      address: address,
      identities: identityArrayResponse,
      signers: signersArrayResponse

    }

    return response
  }

  /**
   * https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0030.md#post-accountsaddresssignsigning-address
   * 
   */
  @Post('/accounts/:address/sign/:sign_address')
  @HttpCode(200)

  async signTransaction(@Param() params: any, @Body() dto: Sep30TransactionSignDto, @Request() req: any) {

    /**VALIDATIONS */

    const address = params.address;
    const sign_address = params["sign_address"];

    // 1. address or sign address are not stellar accounts

    const isStellarAddress = this.sep30Service.validateStellarAccount(address);

    if (!isStellarAddress) {

      throw new HttpException(

        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: `Missing Stellar address in Url parameter`
        },
        HttpStatus.BAD_REQUEST
      );

    }

    const isStellarSignAddress = this.sep30Service.validateStellarAccount(sign_address);

    if (!isStellarSignAddress) {

      throw new HttpException(

        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: `Missing Stellar sign address in Url parameter`
        },
        HttpStatus.BAD_REQUEST
      );

    }

    // 2. The signing address specified must be one of the signing keys that the server has provided as a signer

    const [signersError, signers] = await this.sep30Service.findRecoverySigners();

    if (signersError) {

      throw new HttpException(

        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `We have experienced an error`
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )

    }

    let validSigner = false;

    signers.map((signer) => {

      if (signer.public_key === sign_address) {

        validSigner = true;

      }
    })

    if (!validSigner) {

      throw new HttpException(

        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: `Invalid signer`
        },
        HttpStatus.BAD_REQUEST
      )

    }

    // 3. The client should use the signing address that has been added as a signer to the account

    const [isSigningAddressError, isSigningAddress] = await this.sep30Service.verifyAccountSigner(address, sign_address);

    if (isSigningAddressError) {

      if (isSigningAddressError.name === "NotFoundError") {

        throw new HttpException(

          {
            statusCode: HttpStatus.BAD_REQUEST,
            error: `Stellar account ${address} does not exist`
          },
          HttpStatus.BAD_REQUEST
        )

      }

      else {

        throw new HttpException(

          {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error: `We have experienced an error`
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        )

      }

    }

    if (!isSigningAddress) {

      throw new HttpException(

        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: `Stellar account ${address} does not have account ${sign_address} as signer`
        },
        HttpStatus.BAD_REQUEST
      )

    }

    // // 4. A server must only authorize operations in signed transactions that operate on the registered account that the client has authenticated for

    // Commenting this out because stellar accounts coming from ebioro wallet has a sponsor account which might be the source of some of the operations.
    // therefore, not all the operations can have the source account as the registered account
    
    // const [verifyAuthorizedOperationsError, verifyAuthorizedOperationsResponse] = await this.sep30Service.verifyAuthorizedOperations(address, dto.transaction);

    // if (verifyAuthorizedOperationsError) {

    //   throw new HttpException(

    //     {
    //       statusCode: HttpStatus.BAD_REQUEST,
    //       error: `${verifyAuthorizedOperationsError.message}`
    //     },
    //     HttpStatus.BAD_REQUEST
    //   )

    // }

    // 5. A server should only authorize auth methods previously registered on the registered account 

    const method = req.user.sub.method;
    const value = req.user.sub.value;

    const [foundAuthMethodsError, foundAuthMethods] = await this.sep30Service.findAuthenticationMethod(method, value);

    if (foundAuthMethodsError) {

      throw new HttpException(

        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `We have experienced an error`
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )

    }

    let foundStellarAccount = false;

    for (let i = 0; i < foundAuthMethods.length; i++) {

      const identity = foundAuthMethods[i].identity;

      // don't know if calling account

      const [foundIdentityError, foundIdentity] = await this.sep30Service.findIdentityById(identity.id);

      const addressLinkedToIdentity = foundIdentity.account.address;

      if (addressLinkedToIdentity === address) {

        foundStellarAccount = true;

        break;

      }
    }

    if (!foundStellarAccount) {

      throw new HttpException(

        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: `Authentication method ${method} with value ${value} does not have access to address ${address}`
        },
        HttpStatus.BAD_REQUEST
      )


    }

    const transaction = new TransactionEntity();
    transaction.status = TransactionStatus.PENDING_SIGNATURE;
    transaction.unsigned_stellar_xdr = dto.transaction;

    const [addedTransactionError, addedTransactionResponse] = await this.sep30Service.addTransaction(transaction);

    if (addedTransactionError) {

      throw new HttpException(

        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `We have experienced and error`
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )

    }

    const [queueError, queueResponse] = await this.sep30Service.addTransactionToSigningQueue(addedTransactionResponse);

    if (queueError) {

      throw new HttpException(

        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `We have experienced and error`
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )

    }

    const response = {
      signature: null,
      network_passphrase: this.sep30Service.getNetworkPassPhrase(),
      status: TransactionStatus.PENDING_SIGNATURE,
      transaction_id: addedTransactionResponse.id
    }

    return response

  }

  /**
   * This endpoint is not available in Stellar Sep30 yet.However, it is needed because some recovery key servers might not be able to 
   * send the signature immediately. For example, one using Fireblocks the signature might not be added to a queue to process and 
   * send later because signing for other transaction might be in process. For these cases it is important to be able to provide an 
   * endpoint for the client to call to check for the status of the transaction
   *  
   * @param params: the id of the transaction
   */
  @Get('/transactions/:id')
  @HttpCode(200)

  async getTransaction(@Param() params: TransactionDto) {

    const txId = params.id;

    const [txError, txResponse] = await this.sep30Service.findTransactionById(txId);

    if (txError) {

      throw new HttpException(

        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `We have experienced an error`
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );

    }

    if (!txResponse) {

      throw new HttpException(

        {
          statusCode: HttpStatus.NOT_FOUND,
          error: `Transaction with id ${txId} does not exist`
        },
        HttpStatus.NOT_FOUND
      );

    }

    const response = {

      signature: txResponse.signature,
      network_passphrase: this.sep30Service.getNetworkPassPhrase(),
      status: txResponse.status,
      transaction_id: txResponse.id
    }


    return response

  }


  @Put('/accounts/:address')
  @HttpCode(200)
  async updateIdentity(@Param() params: any, @Body() updateAccountDto: UpdateAccountDto, @Request() req: any) {
    /**VALIDATIONS */

        const address = params.address;

    // 1. Parameter provided needs to be a Stellar Address
    const isStellarAddress = this.sep30Service.validateStellarAccount(address);

    if (!isStellarAddress) {

      throw new HttpException(

        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: `Missing Stellar account in Url parameter`
        },
        HttpStatus.BAD_REQUEST
      );

    }

    const method = req.user.sub.method;
    const value = req.user.sub.value;

    if (method === AvailableAuthMethods.stellar_address) {

      const userInToken: string = value;
      const stellarSep10Account = userInToken.split(':')[0];
      const stellarSep10MemoUser = userInToken.split(':')[1];

      // 2. No support yet for Stellar hosted accounts
      if (stellarSep10MemoUser) {

        throw new HttpException(

          {
            statusCode: HttpStatus.BAD_REQUEST,
            error: `Stellar hosted accounts are not supported`
          },
          HttpStatus.BAD_REQUEST
        );

      }

      // 3. The stellar account provided in the JWT token needs to be equal to the stellar account being updated
      if (stellarSep10Account !== address) {

        throw new HttpException(

          {
            statusCode: HttpStatus.BAD_REQUEST,
            error: `Stellar account in JWT token is not the same as the Stellar account being updated`
          },
          HttpStatus.BAD_REQUEST
        );

      }

    }

    const [foundAccountError, foundStellarAccount] = await this.sep30Service.findStellarAccount(address);

    if (foundAccountError) {

      throw new HttpException(

        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `We have experienced an error`
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    };

    // 4. The account should  be already registered
    if (!foundStellarAccount) {

      throw new HttpException(

        {
          statusCode: HttpStatus.CONFLICT,
          error: `Stellar account does not exist in our system so can not update the identities`
        },
        HttpStatus.CONFLICT
      )
    };

    const indentities = updateAccountDto.identities;

    const [error, validIdentities] = this.sep30Service.validateIdentity(indentities);

    if (error) {

      throw new HttpException(

        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }

    /**END OF VALIDATIONS */

    // Saving account,identities and authMethods

    const account = foundStellarAccount;
    // account.address = address;

    const identityArray: Identity[] = [];

    for (let i = 0; i < indentities.length; i++) {

      const identity = new Identity();
      identity.role = indentities[i].role;
      const authMethods: AuthMethod[] = [];

      for (let j = 0; j < indentities[i].auth_methods.length; j++) {

        const authMethod = new AuthMethod();
        authMethod.type = indentities[i].auth_methods[j].type;
        authMethod.value = indentities[i].auth_methods[j].value;
        authMethods.push(authMethod);

        // const [authMethodError,authMethoResponse] = await this.sep30Service.addAuthMethod(authMethod);

        // if (authMethodError){

        //   throw new HttpException(

        //     {
        //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        //       error: `We have experienced an error`
        //     },
        //     HttpStatus.INTERNAL_SERVER_ERROR
        //     )
        // }

        //     newIdentity=authMethoResponse.identity

        //     //authMethods.push(authMethoResponse);
        // }

        // identity.auth_methods = authMethods;



        // identityArray.push(addedIdentity);

      }

      identity.auth_methods = authMethods;

      identityArray.push(identity);
    }

    account.identities = identityArray;

    // since we are using cascade, identity and authMethods will also be saved when saving the account
    const [addedAccountError, addedAccountResponse] = await this.sep30Service.addAccount(account);

    if (addedAccountError) {

      throw new HttpException(

        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `We have experienced an error`
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )

    }

    const [signersError, signers] = await this.sep30Service.findRecoverySigners();

    if (signersError) {

      throw new HttpException(

        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `We have experienced an error`
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )

    }

    const signersArrayResponse = [];
    const identityArrayResponse = [];

    signers.map((element) => {

      const signer = {
        key: element.public_key
      }

      signersArrayResponse.push(signer)



    })

    identityArray.map((element) => {

      const identity = {
        role: element.role
      }

      identityArrayResponse.push(identity);

    })

    const response = {

      address: address,
      identities: identityArrayResponse,
      signers: signersArrayResponse

    }

    return response

  }

  @Delete('/accounts/:address')
  @HttpCode(200)
  async deleteIdentity(@Param() params: any, @Request() req: any){

    /**VALIDATIONS */

    const address = params.address;

    // 1. Parameter provided needs to be a Stellar Address
    const isStellarAddress = this.sep30Service.validateStellarAccount(address);

    if (!isStellarAddress) {

      throw new HttpException(

        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: `Missing Stellar account in Url parameter`
        },
        HttpStatus.BAD_REQUEST
      );

    }

    const method = req.user.sub.method;
    const value = req.user.sub.value;

    if (method === AvailableAuthMethods.stellar_address) {

      const userInToken: string = value;
      const stellarSep10Account = userInToken.split(':')[0];
      const stellarSep10MemoUser = userInToken.split(':')[1];

      // 2. No support yet for Stellar hosted accounts
      if (stellarSep10MemoUser) {

        throw new HttpException(

          {
            statusCode: HttpStatus.BAD_REQUEST,
            error: `Stellar hosted accounts are not supported`
          },
          HttpStatus.BAD_REQUEST
        );

      }

      // 3. The stellar account provided in the JWT token needs to be equal to the stellar account being deleted
      if (stellarSep10Account !== address) {

        throw new HttpException(

          {
            statusCode: HttpStatus.BAD_REQUEST,
            error: `Stellar account in JWT token is not the same as the Stellar account being deleted`
          },
          HttpStatus.BAD_REQUEST
        );

      }

    }

    const [foundAccountError, foundStellarAccount] = await this.sep30Service.findStellarAccount(address);

    if (foundAccountError) {

      throw new HttpException(

        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `We have experienced an error`
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    };

    // 4. The account should be already registered
    if (!foundStellarAccount) {

      throw new HttpException(

        {
          statusCode: HttpStatus.CONFLICT,
          error: `Stellar account does not exist in our system so can not update the identities`
        },
        HttpStatus.CONFLICT
      )
    };

    const [deleteAccountError, deleteAccountResponse] = await this.sep30Service.removeAccount(foundStellarAccount);
    if (deleteAccountError) {

      throw new HttpException(

        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `We have experienced an error`
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )

    }
   return {
    response: "successfully deleted account"
   }
  }

  @Get('/accounts/:address')
  @HttpCode(200)

  async getIdentity(@Param() params: any,  @Request() req: any){
    /**VALIDATIONS */

    const address = params.address;

    // 1. Parameter provided needs to be a Stellar Address
    const isStellarAddress = this.sep30Service.validateStellarAccount(address);

    if (!isStellarAddress) {

      throw new HttpException(

        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: `Missing Stellar account in Url parameter`
        },
        HttpStatus.BAD_REQUEST
      );

    }

    const method = req.user.sub.method;
    const value = req.user.sub.value;

    if (method === AvailableAuthMethods.stellar_address) {

      const userInToken: string = value;
      const stellarSep10Account = userInToken.split(':')[0];
      const stellarSep10MemoUser = userInToken.split(':')[1];

      // 2. No support yet for Stellar hosted accounts
      if (stellarSep10MemoUser) {

        throw new HttpException(

          {
            statusCode: HttpStatus.BAD_REQUEST,
            error: `Stellar hosted accounts are not supported`
          },
          HttpStatus.BAD_REQUEST
        );

      }

      // 3. The stellar account provided in the JWT token needs to be equal to the stellar account provided in request
      if (stellarSep10Account !== address) {

        throw new HttpException(

          {
            statusCode: HttpStatus.BAD_REQUEST,
            error: `Stellar account in JWT token is not the same as the Stellar account provided in request`
          },
          HttpStatus.BAD_REQUEST
        );

      }

    }

    const [foundAccountError, foundStellarAccount] = await this.sep30Service.findStellarAccount(address);

    if (foundAccountError) {

      throw new HttpException(

        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `We have experienced an error`
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    };

    // 4. The account should not be already registered
    if (!foundStellarAccount) {

      throw new HttpException(

        {
          statusCode: HttpStatus.CONFLICT,
          error: `Stellar account does not exist in our system so can not update the identities`
        },
        HttpStatus.CONFLICT
      )
    };

    const identities = [];
    const signers = [];

    foundStellarAccount.identities.map((identity)=>{
      identities.push({role:identity.role})
    })

    const [recoverySignersError,recoverySigners] = await this.sep30Service.findRecoverySigners();
    
    if (recoverySignersError) {

      throw new HttpException(

        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: `We have experienced an error`
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    };

    recoverySigners.map((signer)=>{
      signers.push({key:signer.public_key})
    })

    const response = {
      address:foundStellarAccount.address,
      identities:identities,
      signers:signers

    }
    
    return response;

  
  }

}

