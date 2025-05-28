import { Test, TestingModule } from '@nestjs/testing';
import { PropertyModuleService } from './property-module.service';

describe('PropertyModuleService', () => {
  let service: PropertyModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropertyModuleService],
    }).compile();

    service = module.get<PropertyModuleService>(PropertyModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
