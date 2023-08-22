import { registerAs } from '@nestjs/config';

export default registerAs('fireblocks', () => ({

  name:"fireblocks",
  api_signer_key:process.env.FIREBLOCKS_API_SIGNER_KEY,
  api_secret: process.env.FIREBLOKS_API_SECRET,
  xlm_asset_id:process.env.FIREBLOKS_XLM_ASSET_ID
}));