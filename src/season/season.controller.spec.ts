import { Test, TestingModule } from '@nestjs/testing';
import { SeasonController } from './season.controller';
import { SeasonService } from './season.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

describe('SeasonController', () => {
  let controller: SeasonController;
  let service: SeasonService;

  const mockSeasonService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByProperty: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeasonController],
      providers: [
        {
          provide: SeasonService,
          useValue: mockSeasonService,
        },
      ],
    }).compile();

    controller = module.get<SeasonController>(SeasonController);
    service = module.get<SeasonService>(SeasonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a season', async () => {
      const createSeasonDto: CreateSeasonDto = {
        name: 'Safra 2024',
        year: 2024,
        propertyId: 'property-id',
      };

      const expectedResult = {
        id: 'season-id',
        ...createSeasonDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        property: {
          id: 'property-id',
          name: 'Farm Test',
        },
        crops: [],
      };

      mockSeasonService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createSeasonDto);

      expect(service.create).toHaveBeenCalledWith(createSeasonDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated seasons', async () => {
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
            id: 'season-1',
            name: 'Safra 2024',
            year: 2024,
            propertyId: 'property-id',
            createdAt: new Date(),
            updatedAt: new Date(),
            property: {
              id: 'property-id',
              name: 'Farm Test',
            },
            crops: [],
          },
        ],
        totalCountOfRegisters: 1,
        currentPage: 1,
      };

      mockSeasonService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(paginationDto);

      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findByProperty', () => {
    it('should return seasons for a specific property', async () => {
      const propertyId = 'property-id';
      const expectedResult = [
        {
          id: 'season-1',
          name: 'Safra 2024',
          year: 2024,
          propertyId,
          createdAt: new Date(),
          updatedAt: new Date(),
          property: {
            id: propertyId,
            name: 'Farm Test',
          },
          crops: [],
        },
      ];

      mockSeasonService.findByProperty.mockResolvedValue(expectedResult);

      const result = await controller.findByProperty(propertyId);

      expect(service.findByProperty).toHaveBeenCalledWith(propertyId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a season by id', async () => {
      const seasonId = 'season-id';
      const expectedResult = {
        id: seasonId,
        name: 'Safra 2024',
        year: 2024,
        propertyId: 'property-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        property: {
          id: 'property-id',
          name: 'Farm Test',
        },
        crops: [],
      };

      mockSeasonService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(seasonId);

      expect(service.findOne).toHaveBeenCalledWith(seasonId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a season', async () => {
      const seasonId = 'season-id';
      const updateSeasonDto: UpdateSeasonDto = {
        name: 'Safra 2024 Updated',
      };

      const expectedResult = {
        id: seasonId,
        name: 'Safra 2024 Updated',
        year: 2024,
        propertyId: 'property-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        property: {
          id: 'property-id',
          name: 'Farm Test',
        },
        crops: [],
      };

      mockSeasonService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(seasonId, updateSeasonDto);

      expect(service.update).toHaveBeenCalledWith(seasonId, updateSeasonDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete a season', async () => {
      const seasonId = 'season-id';
      const expectedResult = {
        id: seasonId,
        name: 'Safra 2024',
        year: 2024,
        propertyId: 'property-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        property: {
          id: 'property-id',
          name: 'Farm Test',
        },
        crops: [],
      };

      mockSeasonService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(seasonId);

      expect(service.remove).toHaveBeenCalledWith(seasonId);
      expect(result).toEqual(expectedResult);
    });
  });
});
