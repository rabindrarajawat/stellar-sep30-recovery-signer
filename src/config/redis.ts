import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({

  name:"redis",
  url: process.env.REDISCLOUD_URL,
  key_prefix:process.env.REDIS_KEY_PREFIX

}));