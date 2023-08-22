import { registerAs } from '@nestjs/config';

export default registerAs('stellar', () => ({

  name:"stellar",
  horizon: process.env.HORIZON_URL,
  horizon_public:process.env.HORIZON_URL_PUBLIC,
  is_testnet:process.env.IS_TESTNET,
  sep_10_signing_key:process.env.STELLAR_SEP10_SIGNING_KEY_PUBlIC,
  sep_10_signing_key_private:process.env.STELLAR_SEP10_SIGNING_KEY_PRIVATE,
  sep_10_signing_alg:process.env.STELLAR_SEP10_SIGNING_ALG,
  sep_10_issuer:process.env.STELLAR_SEP10_ISSUER_URL,
  sep_10_audience:process.env.STELLAR_SEP10_AUDIENCE,
  sep_10_web_auth_domain:process.env.STELLAR_SEP10_WEB_AUTH_DOMAIN,
}));