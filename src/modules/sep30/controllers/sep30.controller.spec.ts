import { Test, TestingModule } from '@nestjs/testing';
import { Sep30Controller } from './sep30.controller';

describe('Sep30Controller', () => {
  let controller: Sep30Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Sep30Controller],
    }).compile();

    controller = module.get<Sep30Controller>(Sep30Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
