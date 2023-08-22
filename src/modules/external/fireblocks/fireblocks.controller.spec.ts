import { Test, TestingModule } from '@nestjs/testing';
import { FireblocksController } from './fireblocks.controller';

describe('FireblocksController', () => {
  let controller: FireblocksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FireblocksController],
    }).compile();

    controller = module.get<FireblocksController>(FireblocksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
