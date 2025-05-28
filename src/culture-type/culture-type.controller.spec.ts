import { Test, TestingModule } from '@nestjs/testing';
import { CultureTypeController } from './culture-type.controller';
import { CultureTypeService } from './culture-type.service';

describe('CultureTypeController', () => {
  let controller: CultureTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CultureTypeController],
      providers: [CultureTypeService],
    }).compile();

    controller = module.get<CultureTypeController>(CultureTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
