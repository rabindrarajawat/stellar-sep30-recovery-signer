import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({

  name:"queue",
  
  removeOnFail: false,
  removeOnComplete: true,
  timeout: 60000, // 1 min
  stackTraceLimit: 1,
  
}));