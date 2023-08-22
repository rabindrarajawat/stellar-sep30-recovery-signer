import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe} from "@nestjs/common";
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import {initializeTransactionalContext,patchTypeORMRepositoryWithBaseRepository} from "typeorm-transactional-cls-hooked";
import {resolve } from 'path';

async function bootstrap() {
  
  initializeTransactionalContext();
  patchTypeORMRepositoryWithBaseRepository();

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,new ExpressAdapter()
  );

  app.enable("trust proxy",1); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
  app.enableCors({methods:['GET', 'POST']});

  const configService = app.get(ConfigService);

  const nodeEnv = configService.get('NODE_ENV');

  // avoid browser blocking nextjs rendering when in development
  if (nodeEnv!='development'){
    app.use(helmet());
  }
  
  app.useGlobalPipes(
    new ValidationPipe({
        whitelist: true,
        transform: false,
        dismissDefaultMessages: false,
        validationError: {
            target: false,
            value: false,
        },
    })
  );
  

  app.useStaticAssets(resolve('./src/public'));
  app.setBaseViewsDir(resolve('./src/views'));
  app.setViewEngine('hbs');

  const port = configService.get('PORT');
  await app.listen(port);
  console.info(`server running on port ${port}`);
}
bootstrap();
