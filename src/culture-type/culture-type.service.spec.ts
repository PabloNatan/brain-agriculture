import { Test, TestingModule } from '@nestjs/testing';
import { CultureTypeService } from './culture-type.service';

describe('CultureTypeService', () => {
  let service: CultureTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CultureTypeService],
    }).compile();

    service = module.get<CultureTypeService>(CultureTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
