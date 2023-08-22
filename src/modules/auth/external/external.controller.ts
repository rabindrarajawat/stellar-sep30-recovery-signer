import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Post, Query,Request,UseGuards } from '@nestjs/common';
import { AvailableAuthMethods } from '../../../interfaces/types';
import { MessageBirdService } from '../../../modules/external/messagebird/messagebird.service';
import { Sep30Service } from '../../../modules/sep30/services/sep30.service';
import { ExternalAuthDto } from './dto/external.auth.dto';
import { VerifyTokenDto } from './dto/verify.dto';
import { ExternalAuthService } from './external.service';
import { AuthGuard } from '@nestjs/passport';
import { Sep10Service } from '../sep10/sep10.service';

@Controller('auth/external')
export class ExternalController {

   constructor(private externalAuthService:ExternalAuthService,private sep10Service:Sep10Service,
    private sep30Service:Sep30Service,private messageBirdService:MessageBirdService
    ){

   }

    @Get()
    @HttpCode(200)
    async getChallenge(@Query() dto:ExternalAuthDto) {

        if (dto.method ===AvailableAuthMethods.email){

            const isValidEmail = this.sep30Service.validateEmail(dto.value);

            if (!isValidEmail){

                throw new HttpException(
        
                    {
                      statusCode: HttpStatus.BAD_REQUEST,
                      error: `Provided email is not valid`
                  },
                  HttpStatus.BAD_REQUEST
                  )

            }

            throw new HttpException(
        
                {
                  statusCode: HttpStatus.NOT_IMPLEMENTED,
                  error: `Method not implemented`
              },
              HttpStatus.NOT_IMPLEMENTED
              )
        }

        if (dto.method ===AvailableAuthMethods.phone_number){

            const isValidPhoneNumber = this.sep30Service.validatePhoneNumber(dto.value);

            if (!isValidPhoneNumber){

                throw new HttpException(
        
                    {
                      statusCode: HttpStatus.BAD_REQUEST,
                      error: `Provided phone number is not valid`
                  },
                  HttpStatus.BAD_REQUEST
                  )

            }

            const [authMethodError,authMethodResponse] = await this.sep30Service.findAuthenticationMethod(dto.method,dto.value);

            if (authMethodError){

                throw new HttpException(
        
                    {
                      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                      error: `We have experienced an error`
                  },
                  HttpStatus.INTERNAL_SERVER_ERROR
                  )

            }

            if (!authMethodResponse){

                throw new HttpException(
        
                    {
                      statusCode: HttpStatus.NOT_FOUND,
                      error: `${dto.method} ${dto.value} not found`
                  },
                  HttpStatus.NOT_FOUND
                  )

            }

            const [error,response] = await this.messageBirdService.getVerificationPhoneToken(dto.value);

            if (error){

                throw new HttpException(
        
                    {
                      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                      error: `We have experienced an error`
                  },
                  HttpStatus.INTERNAL_SERVER_ERROR
                  )

            }

            const jwtToken = this.externalAuthService.generateJWT(dto.method,dto.value)

            const responseToSend = {

                id:response.id,
                jwtToken: jwtToken

            }
        
            return responseToSend

        }   
    }

    @UseGuards(AuthGuard(['auth']))
    @Post('/verify/token')
    @HttpCode(200)
   
    async verifyToken(@Body() dto:VerifyTokenDto,@Request() req:any){

            const [error,response] = await this.messageBirdService.verify2FAToken(dto.id,dto.token);

             const method = req.user.sub.method;
             const value = req.user.sub.value;

            if (error){

                let message = error.message;

                throw new HttpException(
                    {message:message},
                    HttpStatus.UNPROCESSABLE_ENTITY
                );

            }

            const responseStatus = response.status;
            
            if (responseStatus === "verified"){

                const [authMethodError,authMethodResponse] = await this.sep30Service.findAuthenticationMethod(method,value);

                if (authMethodError){

                    throw new HttpException(
            
                        {
                        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                        error: `We have experienced an error`
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR
                    )

                }

                if (!authMethodResponse){

                    throw new HttpException(
            
                        {
                        statusCode: HttpStatus.NOT_FOUND,
                        error: `${method} ${value} not found`
                    },
                    HttpStatus.NOT_FOUND
                    )

                }

                const identityId = authMethodResponse[0].identity.id;

                const [identityError,foundIdentityResponse] = await this.sep30Service.findIdentityById(identityId);
               
                if (identityError){

                    throw new HttpException(
            
                        {
                        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                        error: `We have experienced an error`
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR
                    )

                }

                if (!foundIdentityResponse){

                    throw new HttpException(
            
                        {
                        statusCode: HttpStatus.NOT_FOUND,
                        error: `Identity with provided phone number not found`
                    },
                    HttpStatus.NOT_FOUND
                    )

                }

                const account = foundIdentityResponse.account.address

                const jwt = this.externalAuthService.generateJWT(method,value);

                return {
                    token:jwt,
                    account:account
                }
            }
        
    }

   
    
    
}
