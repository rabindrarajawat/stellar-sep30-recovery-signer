import { Controller, Get, Header, Render, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { NetworkError, Networks } from 'stellar-sdk';

@Controller()
export class AppController {

  constructor(private readonly appService: AppService, private readonly config: ConfigService) {

  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('.well-known/stellar.toml')
  @Header('content-type', 'text/html')
  //@Render('stellar-toml')
  root(@Req() req:any, @Res() res: Response) {

    return res.render(
      'stellar-toml',
      {
        layout: false,
        host: req.headers.host,
        networkPassphrase: this.config.get('stellar').is_testnet?Networks.TESTNET:Networks.PUBLIC,
        signingKey: this.config.get('stellar').sep_10_signing_key,
        
      },
    );

  }
    
}
