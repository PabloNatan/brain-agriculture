import { Test, TestingModule } from '@nestjs/testing';
import { SeasonService } from './season.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SeasonService', () => {
  let service: SeasonService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    season: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    property: {
      findFirst: jest.fn(),
    },
  };

  // Test data factories
  const createMockProperty = (
    id = 'cmb872puz0000rxt91c1maoy8',
    name = 'Farm Test',
  ) => ({
    id,
    name,
  });

  const createMockCultureType = (name = 'Soja') => ({
    name,
  });

  const createMockCrop = (overrides = {}) => ({
    id: 'crop-1',
    cultureType: createMockCultureType(),
    ...overrides,
  });

  const createMockSeason = (overrides = {}) => ({
    id: 'season-id',
    name: 'Safra 2024',
    year: 2024,
    propertyId: 'cmb872puz0000rxt91c1maoy8',
    createdAt: new Date(),
    updatedAt: new Date(),
    property: createMockProperty(),
    crops: [],
    ...overrides,
  });

  // Test DTOs
  const createSeasonDto: CreateSeasonDto = {
    name: 'Safra 2024',
    year: 2024,
    propertyId: 'cmb872puz0000rxt91c1maoy8',
  };

  const basePaginationDto: PaginationDto = {
    currentPage: 1,
    'order[order]': 'asc',
    registersPerPage: 10,
    orderBy: { id: 'asc' },
    filters: {},
  };

  const updateSeasonDto: UpdateSeasonDto = {
    name: 'Safra 2024 Updated',
  };

  // Common include configurations
  const seasonIncludeConfig = {
    property: {
      select: {
        id: true,
        name: true,
      },
    },
    crops: {
      select: {
        id: true,
        cultureType: {
          select: {
            name: true,
          },
        },
      },
    },
  };

  // Helper functions
  const setupValidationMocks = (
    propertyExists = true,
    seasonExists = false,
  ) => {
    mockPrismaService.property.findFirst.mockResolvedValue(
      propertyExists ? createMockProperty() : null,
    );
    mockPrismaService.season.findFirst.mockResolvedValue(
      seasonExists ? createMockSeason() : null,
    );
  };

  const expectPropertyValidationCall = (propertyId: string) => {
    expect(prismaService.property.findFirst).toHaveBeenCalledWith({
      where: { id: propertyId },
    });
  };

  const expectSeasonDuplicateCheck = (
    dto: CreateSeasonDto | UpdateSeasonDto,
    seasonId?: string,
  ) => {
    const whereCondition: any = {
      propertyId: dto.propertyId || createSeasonDto.propertyId,
      name: dto.name,
      year: dto.year,
    };

    if (seasonId) {
      whereCondition.id = { not: seasonId };
    }

    expect(prismaService.season.findFirst).toHaveBeenCalledWith({
      where: whereCondition,
    });
  };

  const expectSeasonFindFirstCall = (seasonId: string) => {
    expect(prismaService.season.findFirst).toHaveBeenCalledWith({
      where: { id: seasonId },
      include: seasonIncludeConfig,
    });
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeasonService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SeasonService>(SeasonService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a season successfully', async () => {
      const expectedResult = createMockSeason();
      setupValidationMocks(true, false);
      mockPrismaService.season.create.mockResolvedValue(expectedResult);

      const result = await service.create(createSeasonDto);

      expectPropertyValidationCall(createSeasonDto.propertyId);
      expectSeasonDuplicateCheck(createSeasonDto);
      expect(prismaService.season.create).toHaveBeenCalledWith({
        data: createSeasonDto,
      });
      expect(result).toEqual(expectedResult);
    });

    it.each([
      ['property not found', false, false],
      ['season already exists', true, true],
    ])(
      'should throw BadRequestException when %s',
      async (_, propertyExists, seasonExists) => {
        setupValidationMocks(propertyExists, seasonExists);

        await expect(service.create(createSeasonDto)).rejects.toThrow(
          BadRequestException,
        );
        expect(prismaService.season.create).not.toHaveBeenCalled();
      },
    );
  });

  describe('findAll', () => {
    it('should return paginated seasons', async () => {
      const seasons = [createMockSeason({ id: 'season-1' })];
      mockPrismaService.season.findMany.mockResolvedValue(seasons);
      mockPrismaService.season.count.mockResolvedValue(1);

      const result = await service.findAll(basePaginationDto);

      expect(prismaService.season.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: basePaginationDto.orderBy,
      });
      expect(result).toEqual({
        data: seasons,
        totalCountOfRegisters: 1,
        currentPage: 1,
      });
    });

    it('should apply filters correctly', async () => {
      const paginationWithFilters: PaginationDto = {
        ...basePaginationDto,
        filters: {
          name: 'Safra',
          year: 2024,
          propertyId: 'cmb872puz0000rxt91c1maoy8',
        },
      };

      mockPrismaService.season.findMany.mockResolvedValue([]);
      mockPrismaService.season.count.mockResolvedValue(0);

      await service.findAll(paginationWithFilters);

      expect(prismaService.season.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'Safra',
            mode: 'insensitive',
          },
          year: 2024,
          propertyId: 'cmb872puz0000rxt91c1maoy8',
        },
        skip: 0,
        take: 10,
        orderBy: basePaginationDto.orderBy,
      });
    });
  });

  describe('findOne', () => {
    const seasonId = 'season-id';

    it('should return a season by id', async () => {
      const season = createMockSeason({ id: seasonId });
      mockPrismaService.season.findFirst.mockResolvedValue(season);

      const result = await service.findOne(seasonId);

      expectSeasonFindFirstCall(seasonId);
      expect(result).toEqual(season);
    });

    it('should throw NotFoundException when season not found', async () => {
      mockPrismaService.season.findFirst.mockResolvedValue(null);

      await expect(service.findOne(seasonId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByProperty', () => {
    const propertyId = 'cmb872puz0000rxt91c1maoy8';

    it('should return seasons for a property', async () => {
      const seasons = [
        createMockSeason({
          id: 'season-1',
          propertyId,
          crops: [createMockCrop()],
        }),
      ];

      mockPrismaService.property.findFirst.mockResolvedValue(
        createMockProperty(propertyId),
      );
      mockPrismaService.season.findMany.mockResolvedValue(seasons);

      const result = await service.findByProperty(propertyId);

      expectPropertyValidationCall(propertyId);
      expect(prismaService.season.findMany).toHaveBeenCalledWith({
        where: { propertyId },
        include: seasonIncludeConfig,
        orderBy: {
          year: 'desc',
        },
      });
      expect(result).toEqual(seasons);
    });

    it('should throw BadRequestException when property not found', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(null);

      await expect(service.findByProperty(propertyId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    const seasonId = 'season-id';

    it('should update a season successfully', async () => {
      const existingSeason = createMockSeason({ id: seasonId });
      const updatedSeason = { ...existingSeason, ...updateSeasonDto };

      mockPrismaService.season.findFirst
        .mockResolvedValueOnce(existingSeason)
        .mockResolvedValueOnce(null);
      mockPrismaService.season.update.mockResolvedValue(updatedSeason);

      const result = await service.update(seasonId, updateSeasonDto);

      expectSeasonFindFirstCall(seasonId);
      expect(prismaService.season.update).toHaveBeenCalledWith({
        where: { id: seasonId },
        data: updateSeasonDto,
      });
      expect(result).toEqual(updatedSeason);
    });

    it('should throw NotFoundException when season not found', async () => {
      mockPrismaService.season.findFirst.mockResolvedValue(null);

      await expect(service.update(seasonId, updateSeasonDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.season.update).not.toHaveBeenCalled();
    });

    it('should validate uniqueness when updating name or year', async () => {
      const existingSeason = createMockSeason({ id: seasonId });
      const updateWithDuplicate: UpdateSeasonDto = {
        name: 'Existing Season',
        year: 2024,
      };
      const duplicateSeason = createMockSeason({
        id: 'other-season-id',
        name: 'Existing Season',
        year: 2024,
      });

      mockPrismaService.season.findFirst
        .mockResolvedValueOnce(existingSeason)
        .mockResolvedValueOnce(duplicateSeason);
      mockPrismaService.season.findUnique.mockResolvedValue(existingSeason);

      await expect(
        service.update(seasonId, updateWithDuplicate),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    const seasonId = 'season-id';

    it('should delete a season successfully', async () => {
      const season = createMockSeason({ id: seasonId });
      mockPrismaService.season.findFirst.mockResolvedValue(season);
      mockPrismaService.season.delete.mockResolvedValue(season);

      const result = await service.remove(seasonId);

      expectSeasonFindFirstCall(seasonId);
      expect(prismaService.season.delete).toHaveBeenCalledWith({
        where: { id: seasonId },
      });
      expect(result).toEqual(season);
    });

    it('should throw NotFoundException when season not found', async () => {
      mockPrismaService.season.findFirst.mockResolvedValue(null);

      await expect(service.remove(seasonId)).rejects.toThrow(NotFoundException);
      expect(prismaService.season.delete).not.toHaveBeenCalled();
    });
  });

  // Additional test cases for better coverage
  describe('edge cases', () => {
    it('should handle multiple seasons for the same property', async () => {
      const propertyId = 'property-1';
      const seasons = [
        createMockSeason({
          id: 'season-1',
          name: 'Safra 2024',
          year: 2024,
          propertyId,
        }),
        createMockSeason({
          id: 'season-2',
          name: 'Safra 2023',
          year: 2023,
          propertyId,
        }),
      ];

      mockPrismaService.property.findFirst.mockResolvedValue(
        createMockProperty(propertyId),
      );
      mockPrismaService.season.findMany.mockResolvedValue(seasons);

      const result = await service.findByProperty(propertyId);

      expect(result).toHaveLength(2);
      expect(result).toEqual(seasons);
    });

    it('should handle pagination with different page sizes', async () => {
      const customPagination: PaginationDto = {
        ...basePaginationDto,
        currentPage: 2,
        registersPerPage: 5,
      };

      mockPrismaService.season.findMany.mockResolvedValue([]);
      mockPrismaService.season.count.mockResolvedValue(10);

      await service.findAll(customPagination);

      expect(prismaService.season.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 5, // (page 2 - 1) * 5
        take: 5,
        orderBy: customPagination.orderBy,
      });
    });

    it('should handle season with multiple crops', async () => {
      const seasonWithCrops = createMockSeason({
        crops: [
          createMockCrop({
            id: 'crop-1',
            cultureType: createMockCultureType('Soja'),
          }),
          createMockCrop({
            id: 'crop-2',
            cultureType: createMockCultureType('Milho'),
          }),
        ],
      });

      mockPrismaService.season.findFirst.mockResolvedValue(seasonWithCrops);

      const result = await service.findOne('season-id');

      expect(result.crops).toHaveLength(2);
      expect(result).toEqual(seasonWithCrops);
    });
  });
});
