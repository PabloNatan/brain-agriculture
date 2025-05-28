import { Test, TestingModule } from '@nestjs/testing';
import { PropertyModuleController } from './property-module.controller';
import { PropertyModuleService } from './property-module.service';

describe('PropertyModuleController', () => {
  let controller: PropertyModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyModuleController],
      providers: [PropertyModuleService],
    }).compile();

    controller = module.get<PropertyModuleController>(PropertyModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
