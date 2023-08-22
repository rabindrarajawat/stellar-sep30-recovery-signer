import { registerAs } from '@nestjs/config';

export default registerAs('messagebird', () => ({

  name:"messagebird",
  
  originator:process.env.SMS_REFERENCE,
  template_en: process.env.SMS_TEMPLATE_EN,
  timeout:process.env.SMS_TOKEN_TIMEOUT,
  apiKey:process.env.MESSAGEBIRD_API_KEY,
  api_url:process.env.MESSAGEBIRD_API_URL
  
}));