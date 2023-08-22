import { Test, TestingModule } from '@nestjs/testing';
import { Sep30Service } from './sep30.service';

describe('Sep30Service', () => {
  let service: Sep30Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Sep30Service],
    }).compile();

    service = module.get<Sep30Service>(Sep30Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
