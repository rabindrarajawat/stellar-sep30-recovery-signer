import { Test, TestingModule } from '@nestjs/testing';
import { FireblocksService } from './fireblocks.service';

describe('FireblocksService', () => {
  let service: FireblocksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FireblocksService],
    }).compile();

    service = module.get<FireblocksService>(FireblocksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
