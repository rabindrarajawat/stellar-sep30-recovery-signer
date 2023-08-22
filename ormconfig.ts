import {ConnectionOptions} from 'typeorm';

// You can load you .env file here synchronously using dotenv package (not installed here),
 //import * as dotenv from 'dotenv';
 //import * as fs from 'fs';
 //const environment = process.env.NODE_ENV || 'development';
 //const data: any = dotenv.parse(fs.readFileSync(`.${environment}.env`));
 import {SnakeNamingStrategy} from "./src/snake-naming.strategy";
 

// Check typeORM documentation for more information.
const config: ConnectionOptions = {
  type: 'postgres',
  url:`${process.env.DATABASE_URL}`,
  entities: ['src/modules/**/*.entity{.ts,.js}'],
  
  // We are using migrations, synchronize should be set to false.
  synchronize: false,

  // Run migrations automatically,
  // you can disable this if you prefer running migration manually.
  migrationsRun: true,
  logging: true,
  logger: 'file',
  namingStrategy: new SnakeNamingStrategy(), 

  // allow both start:prod and start:dev to use migrations
  // __dirname is either dist or src folder, meaning either
  // the compiled js in prod or the ts in dev
  migrations: ['src/migrations/*{.ts,.js}'],
  cli: {
    migrationsDir: 'src/migrations',
  },
};

export default config;