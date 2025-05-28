import { Test, TestingModule } from '@nestjs/testing';
import { CultureTypeController } from './culture-type.controller';
import { CultureTypeService } from './culture-type.service';
import { CreateCultureTypeDto } from './dto/create-culture-type.dto';
import { UpdateCultureTypeDto } from './dto/update-culture-type.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CultureTypeController', () => {
  let controller: CultureTypeController;
  let service: CultureTypeService;

  const mockCultureTypeService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CultureTypeController],
      providers: [
        {
          provide: CultureTypeService,
          useValue: mockCultureTypeService,
        },
      ],
    }).compile();

    controller = module.get<CultureTypeController>(CultureTypeController);
    service = module.get<CultureTypeService>(CultureTypeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createCultureTypeDto: CreateCultureTypeDto = {
      title: 'Soja',
      name: 'soja',
    };

    it('should create a culture type successfully', async () => {
      const expectedResult = { id: '1', ...createCultureTypeDto };
      mockCultureTypeService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createCultureTypeDto);

      expect(service.create).toHaveBeenCalledWith(createCultureTypeDto);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate service exceptions', async () => {
      const error = new BadRequestException('Culture type with this name already exists');
      mockCultureTypeService.create.mockRejectedValue(error);

      await expect(controller.create(createCultureTypeDto)).rejects.toThrow(error);
    });
  });

  describe('findAll', () => {
    const paginationDto: PaginationDto = {
      currentPage: 1,
      registersPerPage: 10,
      'order[order]': 'asc' as const,
      filters: {},
    };

    it('should return paginated culture types', async () => {
      const expectedResult = {
        data: [
          { id: '1', title: 'Soja', name: 'soja', _count: { crops: 5 } },
          { id: '2', title: 'Milho', name: 'milho', _count: { crops: 3 } },
        ],
        totalCountOfRegisters: 2,
        currentPage: 1,
      };

      mockCultureTypeService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(paginationDto);

      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle pagination with filters', async () => {
      const paginationWithFilters: PaginationDto = {
        currentPage: 2,
        registersPerPage: 5,
        'order[order]': 'desc' as const,
        filters: { title: 'Soja' },
      };

      const expectedResult = {
        data: [{ id: '1', title: 'Soja', name: 'soja', _count: { crops: 5 } }],
        totalCountOfRegisters: 1,
        currentPage: 2,
      };

      mockCultureTypeService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(paginationWithFilters);

      expect(service.findAll).toHaveBeenCalledWith(paginationWithFilters);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    const mockCultureType = {
      id: '1',
      title: 'Soja',
      name: 'soja',
      _count: { crops: 5 },
    };

    it('should return a culture type by id', async () => {
      mockCultureTypeService.findOne.mockResolvedValue(mockCultureType);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockCultureType);
    });

    it('should propagate NotFoundException from service', async () => {
      const error = new NotFoundException('Culture type not found');
      mockCultureTypeService.findOne.mockRejectedValue(error);

      await expect(controller.findOne('non-existent')).rejects.toThrow(error);
    });
  });

  describe('update', () => {
    const updateCultureTypeDto: UpdateCultureTypeDto = {
      title: 'Updated Soja',
      name: 'updated-soja',
    };

    const updatedCultureType = {
      id: '1',
      title: 'Updated Soja',
      name: 'updated-soja',
    };

    it('should update a culture type successfully', async () => {
      mockCultureTypeService.update.mockResolvedValue(updatedCultureType);

      const result = await controller.update('1', updateCultureTypeDto);

      expect(service.update).toHaveBeenCalledWith('1', updateCultureTypeDto);
      expect(result).toEqual(updatedCultureType);
    });

    it('should propagate NotFoundException from service', async () => {
      const error = new NotFoundException('Culture type not found');
      mockCultureTypeService.update.mockRejectedValue(error);

      await expect(controller.update('non-existent', updateCultureTypeDto)).rejects.toThrow(error);
    });

    it('should propagate BadRequestException from service', async () => {
      const error = new BadRequestException('Culture type with this name already exists');
      mockCultureTypeService.update.mockRejectedValue(error);

      await expect(controller.update('1', updateCultureTypeDto)).rejects.toThrow(error);
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { title: 'Only Title Update' };
      const partiallyUpdated = { id: '1', title: 'Only Title Update', name: 'soja' };

      mockCultureTypeService.update.mockResolvedValue(partiallyUpdated);

      const result = await controller.update('1', partialUpdate);

      expect(service.update).toHaveBeenCalledWith('1', partialUpdate);
      expect(result).toEqual(partiallyUpdated);
    });
  });

  describe('remove', () => {
    const deletedCultureType = {
      id: '1',
      title: 'Soja',
      name: 'soja',
    };

    it('should delete a culture type successfully', async () => {
      mockCultureTypeService.remove.mockResolvedValue(deletedCultureType);

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith('1');
      expect(result).toEqual(deletedCultureType);
    });

    it('should propagate NotFoundException from service', async () => {
      const error = new NotFoundException('Culture type not found');
      mockCultureTypeService.remove.mockRejectedValue(error);

      await expect(controller.remove('non-existent')).rejects.toThrow(error);
    });

    it('should propagate BadRequestException when culture type is in use', async () => {
      const error = new BadRequestException('Cannot delete culture type that is being used in crops');
      mockCultureTypeService.remove.mockRejectedValue(error);

      await expect(controller.remove('1')).rejects.toThrow(error);
    });
  });
});
