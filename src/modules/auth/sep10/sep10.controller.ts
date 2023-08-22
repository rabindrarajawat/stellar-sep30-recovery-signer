import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Post, Query } from "@nestjs/common";
import { Sep10Service } from "./sep10.service";
import { ChallengeRequestDto } from "./dto/ChallengeRequestDto";
import { SignedChallengeDto } from "./dto/SignedChallengeDto";
import { ApiOperation,ApiResponse, ApiTags } from "@nestjs/swagger";


@ApiTags('Authentication') 
@Controller('auth/sep10')
export class Sep10Controller {
    constructor(public readonly authService: Sep10Service) {}

    @ApiResponse({
        status: 200,
        description: 'On success the endpoint will return 200 HTTP status code and a JSON object with these fields:',
        content:{
            "application/json":{
                example:{
                    "transaction": "AAAAAgAAAADIiRu2BrqqeOcP28PWCkD4D5Rjjsqh71HwvqFX+F4VXAAAAGQAAAAAAAAAAAAAAAEAAAAAXzrUcQAAAABfOtf1AAAAAAAAAAEAAAABAAAAAEEB8rhqNa70RYjaNnF1ARE2CbL50iR9HPXST/fImJN1AAAACgAAADB0aGlzaXNhdGVzdC5zYW5kYm94LmFuY2hvci5hbmNob3Jkb21haW4uY29tIGF1dGgAAAABAAAAQGdGOFlIQm1zaGpEWEY0L0VJUFZucGVlRkxVTDY2V0tKMVBPYXZuUVVBNjBoL09XaC91M2Vvdk54WFJtSTAvQ2UAAAAAAAAAAfheFVwAAABAheKE1HjGnUCNwPbX8mz7CqotShKbA+xM2Hbjl6X0TBpEprVOUVjA6lqMJ1j62vrxn1mF3eJzsLa9s9hRofG3Ag==",
                    "network_passphrase": "Public Global Stellar Network ; September 2015"
                },
                schema:{
                    type:"object",
                    properties:{
                        'transaction':{
                            type:'string'
                        },
                        'network_passphrase':{
                            type:'string'
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request due to field validation',
        content:{
            "application/json":{
                example:{
                    "statusCode": 400,
                    "message": [
                        "Stellar account is not valid!"
                    ],
                    "error": "Bad Request"
                },
                schema:{
                    type:"object",
                    properties:{
                        'statusCode':{
                            type:'number'
                        },
                        'message':{
                            type:'array'
                        },
                        "error":{
                            type:'string'
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
        content:{
            "application/json":{
                example:{error:`We have experienced and error`},
                schema:{
                    type:"object",
                    properties:{
                        'error':{
                            type:'string'
                        } 
                    }
                }
            }
        }
    })
    @ApiOperation({
        operationId:'Challenge',
        description:`${`This endpoint responds with a Stellar transaction signed by the OrunPay's Stellar Server Account. 
        It has an invalid sequence number (0) and thus cannot be executed on the Stellar network. 
        The Client application needs to sign this transaction using standard Stellar libraries and submit 
        it to token endpoint to prove that it controls the Client Account`}`
    })
    
    @Get()
    @HttpCode(200)
    async getChallenge(@Query() challengedto: ChallengeRequestDto) {
        
        const [error,response] = await this.authService.generateChallenge(
            challengedto.account,challengedto.memo,challengedto.home_domain,challengedto.client_domain
        );

        if (error){
            throw new HttpException(
                {error:`${error}`},
                HttpStatus.BAD_REQUEST
            );
        }

        return response;
    }

    @ApiResponse({
        status: 200,
        description: 'On success the endpoint will return 200 HTTP status code and a JSON object with these fields:',
        content:{
            "application/json":{
                example:{
                    token: `${`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJlYmlvcm8uY29tIiwic3ViIjoiR0FFNTdNSDZNUFBYUEVaTEZaWTZFSktYWFpGUUdGVUFMREszWlBITFdUWjZMQzdQSzRSRk5TVEwiLCJhdWQiOiJodHRwczovL3FhLmFwaS5vcnVucGF5LmNvbS92MSIsImlhdCI6MTY0OTQyNjEyMywiZXhwIjoxNjQ5NDQ3NzIzfQ.aA_TNisZRYez7i5tR74soLFj97SJf4DJN_ahLV05yyo`}`,
                },
                schema:{
                    type:"object",
                    properties:{
                        'token':{
                            type:'string'
                        },
                    }
                }
            }
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Signed transaction validation error',
        content:{
            "application/json":{
                example:{
                    error: "InvalidSep10ChallengeError",
                    message: "None of the given signers match the transaction signatures"
                },
                schema:{
                    type:"object",
                    properties:{
                        error:{
                            type:'string'
                        },
                        message:{
                            type:'string'
                        }
                    }
                }
            }
        }
    })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
        content:{
            "application/json":{
                example:{
                    error: "InternalServerError",
                    message: "We have experienced an error"
                },
                schema:{
                    type:"object",
                    properties:{
                        error:{
                            type:'string'
                        },
                        message:{
                            type:'string'
                        }
                    }
                }
            }
        }
    })
    @ApiOperation({
        operationId:'Token',
        description:`${`This endpoint accepts a signed challenge transaction, 
        validates it and responds with a session JSON Web Token authenticating the account.`}`
    })

    @Post()
    @HttpCode(200)
    async getToken(@Body() signedChallengeDto: SignedChallengeDto) {
        
        const response = await this.authService.getToken(signedChallengeDto.transaction);
        return response;
    }
}