import { registerAs } from '@nestjs/config';

export default registerAs('client_app', () => ({
  name:"client_app",
  url:process.env.SEP30_CLIENT_URL
}));