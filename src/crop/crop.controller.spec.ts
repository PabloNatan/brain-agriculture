import { Test, TestingModule } from '@nestjs/testing';
import { CropController } from './crop.controller';
import { CropService } from './crop.service';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

describe('CropController', () => {
  let controller: CropController;
  let service: CropService;

  const mockCropService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findBySeasonId: jest.fn(),
    findByCultureTypeId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CropController],
      providers: [
        {
          provide: CropService,
          useValue: mockCropService,
        },
      ],
    }).compile();

    controller = module.get<CropController>(CropController);
    service = module.get<CropService>(CropService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a crop', async () => {
      const createCropDto: CreateCropDto = {
        seasonId: 'season-1',
        cultureTypeId: 'culture-1',
        plantedArea: 100.5,
      };

      const expectedResult = {
        id: 'crop-id',
        ...createCropDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        season: {
          id: 'season-1',
          name: 'Safra 2024',
          property: {
            id: 'property-1',
            name: 'Fazenda Test',
          },
        },
        cultureType: {
          id: 'culture-1',
          name: 'Soja',
        },
      };

      mockCropService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createCropDto);

      expect(service.create).toHaveBeenCalledWith(createCropDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated crops', async () => {
      const paginationDto: PaginationDto = {
        currentPage: 1,
        registersPerPage: 10,
        'order[order]': 'asc' as const,
        orderBy: { id: 'asc' },
        filters: {},
      };

      const expectedResult = {
        data: [
          {
            id: 'crop-1',
            seasonId: 'season-1',
            cultureTypeId: 'culture-1',
            plantedArea: 100.5,
            createdAt: new Date(),
            updatedAt: new Date(),
            season: {
              id: 'season-1',
              name: 'Safra 2024',
              property: {
                id: 'property-1',
                name: 'Fazenda Test',
              },
            },
            cultureType: {
              id: 'culture-1',
              name: 'Soja',
            },
          },
        ],
        totalCountOfRegisters: 1,
        currentPage: 1,
      };

      mockCropService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(paginationDto);

      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a crop by id', async () => {
      const cropId = 'crop-id';
      const expectedResult = {
        id: cropId,
        seasonId: 'season-1',
        cultureTypeId: 'culture-1',
        plantedArea: 100.5,
        createdAt: new Date(),
        updatedAt: new Date(),
        season: {
          id: 'season-1',
          name: 'Safra 2024',
          property: {
            id: 'property-1',
            name: 'Fazenda Test',
          },
        },
        cultureType: {
          id: 'culture-1',
          name: 'Soja',
        },
      };

      mockCropService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(cropId);

      expect(service.findOne).toHaveBeenCalledWith(cropId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a crop', async () => {
      const cropId = 'crop-id';
      const updateCropDto: UpdateCropDto = {
        plantedArea: 150.75,
      };

      const expectedResult = {
        id: cropId,
        seasonId: 'season-1',
        cultureTypeId: 'culture-1',
        plantedArea: 150.75,
        createdAt: new Date(),
        updatedAt: new Date(),
        season: {
          id: 'season-1',
          name: 'Safra 2024',
          property: {
            id: 'property-1',
            name: 'Fazenda Test',
          },
        },
        cultureType: {
          id: 'culture-1',
          name: 'Soja',
        },
      };

      mockCropService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(cropId, updateCropDto);

      expect(service.update).toHaveBeenCalledWith(cropId, updateCropDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete a crop', async () => {
      const cropId = 'crop-id';
      const expectedResult = {
        id: cropId,
        seasonId: 'season-1',
        cultureTypeId: 'culture-1',
        plantedArea: 100.5,
        createdAt: new Date(),
        updatedAt: new Date(),
        season: {
          id: 'season-1',
          name: 'Safra 2024',
          property: {
            id: 'property-1',
            name: 'Fazenda Test',
          },
        },
        cultureType: {
          id: 'culture-1',
          name: 'Soja',
        },
      };

      mockCropService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(cropId);

      expect(service.remove).toHaveBeenCalledWith(cropId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findBySeasonId', () => {
    it('should return crops by season id', async () => {
      const seasonId = 'season-1';
      const expectedResult = [
        {
          id: 'crop-1',
          seasonId,
          cultureTypeId: 'culture-1',
          plantedArea: 100.5,
          createdAt: new Date(),
          updatedAt: new Date(),
          season: {
            id: 'season-1',
            name: 'Safra 2024',
            property: {
              id: 'property-1',
              name: 'Fazenda Test',
            },
          },
          cultureType: {
            id: 'culture-1',
            name: 'Soja',
          },
        },
      ];

      mockCropService.findBySeasonId.mockResolvedValue(expectedResult);

      const result = await controller.findBySeasonId(seasonId);

      expect(service.findBySeasonId).toHaveBeenCalledWith(seasonId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findByCultureTypeId', () => {
    it('should return crops by culture type id', async () => {
      const cultureTypeId = 'culture-1';
      const expectedResult = [
        {
          id: 'crop-1',
          seasonId: 'season-1',
          cultureTypeId,
          plantedArea: 100.5,
          createdAt: new Date(),
          updatedAt: new Date(),
          season: {
            id: 'season-1',
            name: 'Safra 2024',
            property: {
              id: 'property-1',
              name: 'Fazenda Test',
            },
          },
          cultureType: {
            id: 'culture-1',
            name: 'Soja',
          },
        },
      ];

      mockCropService.findByCultureTypeId.mockResolvedValue(expectedResult);

      const result = await controller.findByCultureTypeId(cultureTypeId);

      expect(service.findByCultureTypeId).toHaveBeenCalledWith(cultureTypeId);
      expect(result).toEqual(expectedResult);
    });
  });
});
