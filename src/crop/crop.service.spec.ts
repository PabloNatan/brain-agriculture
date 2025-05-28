import { Test, TestingModule } from '@nestjs/testing';
import { CropService } from './crop.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CropService', () => {
  let service: CropService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    crop: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    season: {
      findFirst: jest.fn(),
    },
    cultureType: {
      findFirst: jest.fn(),
    },
  };

  // Test data factories
  const createMockSeason = (id = 'season-1', name = 'Safra 2024') => ({
    id,
    name,
    property: {
      id: 'property-1',
      name: 'Fazenda Test',
    },
  });

  const createMockCultureType = (id = 'culture-1', name = 'Soja') => ({
    id,
    name,
  });

  const createMockCrop = (overrides = {}) => ({
    id: 'crop-id',
    seasonId: 'season-1',
    cultureTypeId: 'culture-1',
    plantedArea: 100.5,
    createdAt: new Date(),
    updatedAt: new Date(),
    season: createMockSeason(),
    cultureType: createMockCultureType(),
    ...overrides,
  });

  const createCropDto: CreateCropDto = {
    seasonId: 'season-1',
    cultureTypeId: 'culture-1',
    plantedArea: 100.5,
  };

  const basePaginationDto: PaginationDto = {
    currentPage: 1,
    'order[order]': 'asc',
    registersPerPage: 10,
    orderBy: { id: 'asc' },
    filters: {},
  };

  // Common include configuration
  const cropIncludeConfig = {
    season: {
      select: {
        id: true,
        name: true,
      },
    },
    cultureType: {
      select: {
        id: true,
        title: true,
      },
    },
  };

  // Helper functions
  const setupValidationMocks = (
    seasonExists = true,
    cultureTypeExists = true,
    cropExists = false,
  ) => {
    mockPrismaService.season.findFirst.mockResolvedValue(
      seasonExists ? createMockSeason() : null,
    );
    mockPrismaService.cultureType.findFirst.mockResolvedValue(
      cultureTypeExists ? createMockCultureType() : null,
    );
    mockPrismaService.crop.findFirst.mockResolvedValue(
      cropExists ? createMockCrop() : null,
    );
  };

  const expectValidationCalls = (dto: CreateCropDto | UpdateCropDto) => {
    if ('seasonId' in dto && dto.seasonId) {
      expect(prismaService.season.findFirst).toHaveBeenCalledWith({
        where: { id: dto.seasonId },
      });
    }
    if ('cultureTypeId' in dto && dto.cultureTypeId) {
      expect(prismaService.cultureType.findFirst).toHaveBeenCalledWith({
        where: { id: dto.cultureTypeId },
      });
    }
  };

  const expectCropFindFirstCall = (cropId: string) => {
    expect(prismaService.crop.findFirst).toHaveBeenCalledWith({
      where: { id: cropId },
      include: cropIncludeConfig,
    });
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CropService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CropService>(CropService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a crop successfully', async () => {
      const expectedResult = createMockCrop();
      setupValidationMocks(true, true, false);
      mockPrismaService.crop.create.mockResolvedValue(expectedResult);

      const result = await service.create(createCropDto);

      expectValidationCalls(createCropDto);
      expect(prismaService.crop.findFirst).toHaveBeenCalledWith({
        where: {
          seasonId: createCropDto.seasonId,
          cultureTypeId: createCropDto.cultureTypeId,
        },
      });
      expect(prismaService.crop.create).toHaveBeenCalledWith({
        data: createCropDto,
      });
      expect(result).toEqual(expectedResult);
    });

    it.each([
      ['season not found', false, true, false],
      ['culture type not found', true, false, false],
      ['crop combination already exists', true, true, true],
    ])(
      'should throw BadRequestException when %s',
      async (_, seasonExists, cultureTypeExists, cropExists) => {
        setupValidationMocks(seasonExists, cultureTypeExists, cropExists);

        await expect(service.create(createCropDto)).rejects.toThrow(
          BadRequestException,
        );
        expect(prismaService.crop.create).not.toHaveBeenCalled();
      },
    );
  });

  describe('findAll', () => {
    it('should return paginated crops', async () => {
      const crops = [createMockCrop({ id: 'crop-1' })];
      mockPrismaService.crop.findMany.mockResolvedValue(crops);
      mockPrismaService.crop.count.mockResolvedValue(1);

      const result = await service.findAll(basePaginationDto);

      expect(prismaService.crop.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: basePaginationDto.orderBy,
      });
      expect(result).toEqual({
        data: crops,
        totalCountOfRegisters: 1,
        currentPage: 1,
      });
    });

    it('should apply filters correctly', async () => {
      const paginationWithFilters: PaginationDto = {
        ...basePaginationDto,
        filters: { seasonId: 'season-1', cultureTypeId: 'culture-1' },
      };

      mockPrismaService.crop.findMany.mockResolvedValue([]);
      mockPrismaService.crop.count.mockResolvedValue(0);

      await service.findAll(paginationWithFilters);

      expect(prismaService.crop.findMany).toHaveBeenCalledWith({
        where: paginationWithFilters.filters,
        skip: 0,
        take: 10,
        orderBy: basePaginationDto.orderBy,
      });
    });
  });

  describe('findOne', () => {
    const cropId = 'crop-id';

    it('should return a crop by id', async () => {
      const crop = createMockCrop({ id: cropId });
      mockPrismaService.crop.findFirst.mockResolvedValue(crop);

      const result = await service.findOne(cropId);

      expectCropFindFirstCall(cropId);
      expect(result).toEqual(crop);
    });

    it('should throw NotFoundException when crop not found', async () => {
      mockPrismaService.crop.findFirst.mockResolvedValue(null);

      await expect(service.findOne(cropId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const cropId = 'crop-id';
    const updateCropDto: UpdateCropDto = {
      plantedArea: 150.75,
    };

    it('should update a crop successfully', async () => {
      const existingCrop = createMockCrop({ id: cropId });
      const updatedCrop = { ...existingCrop, ...updateCropDto };

      mockPrismaService.crop.findFirst.mockResolvedValue(existingCrop);
      mockPrismaService.crop.update.mockResolvedValue(updatedCrop);

      const result = await service.update(cropId, updateCropDto);

      expectCropFindFirstCall(cropId);
      expect(prismaService.crop.update).toHaveBeenCalledWith({
        where: { id: cropId },
        data: updateCropDto,
      });
      expect(result).toEqual(updatedCrop);
    });

    it('should throw NotFoundException when crop not found', async () => {
      mockPrismaService.crop.findFirst.mockResolvedValue(null);

      await expect(service.update(cropId, updateCropDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.crop.update).not.toHaveBeenCalled();
    });

    it('should validate season and culture type when updating', async () => {
      const existingCrop = createMockCrop({ id: cropId });
      const updateWithIds: UpdateCropDto = {
        seasonId: 'season-2',
        cultureTypeId: 'culture-2',
      };

      mockPrismaService.crop.findFirst
        .mockResolvedValueOnce(existingCrop)
        .mockResolvedValueOnce(null);
      mockPrismaService.season.findFirst.mockResolvedValue(
        createMockSeason('season-2', 'Safra 2025'),
      );
      mockPrismaService.cultureType.findFirst.mockResolvedValue(
        createMockCultureType('culture-2', 'Milho'),
      );
      mockPrismaService.crop.update.mockResolvedValue({
        ...existingCrop,
        ...updateWithIds,
      });

      await service.update(cropId, updateWithIds);

      expectValidationCalls(updateWithIds);
      expect(prismaService.crop.findFirst).toHaveBeenCalledWith({
        where: {
          seasonId: 'season-2',
          cultureTypeId: 'culture-2',
          id: { not: cropId },
        },
      });
    });

    it('should throw BadRequestException when trying to update with existing combination', async () => {
      const existingCrop = createMockCrop({ id: cropId });
      const updateWithConflict: UpdateCropDto = {
        seasonId: 'season-2',
        cultureTypeId: 'culture-2',
      };
      const conflictingCrop = createMockCrop({
        id: 'different-crop-id',
        seasonId: 'season-2',
        cultureTypeId: 'culture-2',
      });

      mockPrismaService.crop.findFirst
        .mockResolvedValueOnce(existingCrop)
        .mockResolvedValueOnce(conflictingCrop);
      setupValidationMocks(true, true, false);

      await expect(service.update(cropId, updateWithConflict)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.crop.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const cropId = 'crop-id';

    it('should delete a crop successfully', async () => {
      const crop = createMockCrop({ id: cropId });
      mockPrismaService.crop.findFirst.mockResolvedValue(crop);
      mockPrismaService.crop.delete.mockResolvedValue(crop);

      const result = await service.remove(cropId);

      expectCropFindFirstCall(cropId);
      expect(prismaService.crop.delete).toHaveBeenCalledWith({
        where: { id: cropId },
      });
      expect(result).toEqual(crop);
    });

    it('should throw NotFoundException when crop not found', async () => {
      mockPrismaService.crop.findFirst.mockResolvedValue(null);

      await expect(service.remove(cropId)).rejects.toThrow(NotFoundException);
      expect(prismaService.crop.delete).not.toHaveBeenCalled();
    });
  });

  describe('findBySeasonId', () => {
    it('should return crops by season id', async () => {
      const seasonId = 'season-1';
      const crops = [createMockCrop({ id: 'crop-1', seasonId })];

      mockPrismaService.crop.findMany.mockResolvedValue(crops);

      const result = await service.findBySeasonId(seasonId);

      expect(prismaService.crop.findMany).toHaveBeenCalledWith({
        where: { seasonId },
        include: cropIncludeConfig,
      });
      expect(result).toEqual(crops);
    });
  });

  describe('findByCultureTypeId', () => {
    it('should return crops by culture type id', async () => {
      const cultureTypeId = 'culture-1';
      const crops = [createMockCrop({ id: 'crop-1', cultureTypeId })];

      mockPrismaService.crop.findMany.mockResolvedValue(crops);

      const result = await service.findByCultureTypeId(cultureTypeId);

      expect(prismaService.crop.findMany).toHaveBeenCalledWith({
        where: { cultureTypeId },
        include: cropIncludeConfig,
      });
      expect(result).toEqual(crops);
    });
  });
});
