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
    const createCropDto: CreateCropDto = {
      seasonId: 'season-1',
      cultureTypeId: 'culture-1',
      plantedArea: 100.5,
    };

    it('should create a crop successfully', async () => {
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

      mockPrismaService.season.findFirst.mockResolvedValue({
        id: 'season-1',
        name: 'Safra 2024',
      });
      mockPrismaService.cultureType.findFirst.mockResolvedValue({
        id: 'culture-1',
        name: 'Soja',
      });
      mockPrismaService.crop.findFirst.mockResolvedValue(null);
      mockPrismaService.crop.create.mockResolvedValue(expectedResult);

      const result = await service.create(createCropDto);

      expect(prismaService.season.findFirst).toHaveBeenCalledWith({
        where: { id: createCropDto.seasonId },
      });
      expect(prismaService.cultureType.findFirst).toHaveBeenCalledWith({
        where: { id: createCropDto.cultureTypeId },
      });
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

    it('should throw BadRequestException when season not found', async () => {
      mockPrismaService.season.findFirst.mockResolvedValue(null);

      await expect(service.create(createCropDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.crop.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when culture type not found', async () => {
      mockPrismaService.season.findFirst.mockResolvedValue({
        id: 'season-1',
        name: 'Safra 2024',
      });
      mockPrismaService.cultureType.findFirst.mockResolvedValue(null);

      await expect(service.create(createCropDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.crop.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when crop combination already exists', async () => {
      const existingCrop = {
        id: 'existing-crop',
        seasonId: 'season-1',
        cultureTypeId: 'culture-1',
      };

      mockPrismaService.season.findFirst.mockResolvedValue({
        id: 'season-1',
        name: 'Safra 2024',
      });
      mockPrismaService.cultureType.findFirst.mockResolvedValue({
        id: 'culture-1',
        name: 'Soja',
      });
      mockPrismaService.crop.findFirst.mockResolvedValue(existingCrop);

      await expect(service.create(createCropDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.crop.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const paginationDto: PaginationDto = {
      currentPage: 1,
      'order[order]': 'asc',
      registersPerPage: 10,
      orderBy: { id: 'asc' },
      filters: {},
    };

    it('should return paginated crops', async () => {
      const crops = [
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
      ];

      mockPrismaService.crop.findMany.mockResolvedValue(crops);
      mockPrismaService.crop.count.mockResolvedValue(1);

      const result = await service.findAll(paginationDto);

      expect(prismaService.crop.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: paginationDto.orderBy,
      });
      expect(result).toEqual({
        data: crops,
        totalCountOfRegisters: 1,
        currentPage: 1,
      });
    });

    it('should apply filters correctly', async () => {
      const paginationWithFilters: PaginationDto = {
        ...paginationDto,
        filters: { seasonId: 'season-1', cultureTypeId: 'culture-1' },
      };

      mockPrismaService.crop.findMany.mockResolvedValue([]);
      mockPrismaService.crop.count.mockResolvedValue(0);

      await service.findAll(paginationWithFilters);

      expect(prismaService.crop.findMany).toHaveBeenCalledWith({
        where: {
          seasonId: 'season-1',
          cultureTypeId: 'culture-1',
        },
        skip: 0,
        take: 10,
        orderBy: paginationDto.orderBy,
      });
    });
  });

  describe('findOne', () => {
    it('should return a crop by id', async () => {
      const cropId = 'crop-id';
      const crop = {
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

      mockPrismaService.crop.findFirst.mockResolvedValue(crop);

      const result = await service.findOne(cropId);

      expect(prismaService.crop.findFirst).toHaveBeenCalledWith({
        where: { id: cropId },
        include: {
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
        },
      });
      expect(result).toEqual(crop);
    });

    it('should throw NotFoundException when crop not found', async () => {
      const cropId = 'non-existing-id';

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
      const existingCrop = {
        id: cropId,
        seasonId: 'season-1',
        cultureTypeId: 'culture-1',
        plantedArea: 100.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCrop = {
        ...existingCrop,
        plantedArea: 150.75,
      };

      mockPrismaService.crop.findFirst.mockResolvedValue(existingCrop);
      mockPrismaService.crop.update.mockResolvedValue(updatedCrop);

      const result = await service.update(cropId, updateCropDto);

      expect(prismaService.crop.findFirst).toHaveBeenCalledWith({
        where: { id: cropId },
        include: {
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
        },
      });
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
      const existingCrop = {
        id: cropId,
        seasonId: 'season-1',
        cultureTypeId: 'culture-1',
        plantedArea: 100.5,
      };

      const updateWithIds: UpdateCropDto = {
        seasonId: 'season-2',
        cultureTypeId: 'culture-2',
      };

      mockPrismaService.crop.findFirst
        .mockResolvedValueOnce(existingCrop)
        .mockResolvedValueOnce(null);
      mockPrismaService.season.findFirst.mockResolvedValue({
        id: 'season-2',
        name: 'Safra 2025',
      });
      mockPrismaService.cultureType.findFirst.mockResolvedValue({
        id: 'culture-2',
        name: 'Milho',
      });
      mockPrismaService.crop.update.mockResolvedValue({
        ...existingCrop,
        ...updateWithIds,
      });

      await service.update(cropId, updateWithIds);

      expect(prismaService.season.findFirst).toHaveBeenCalledWith({
        where: { id: 'season-2' },
      });
      expect(prismaService.cultureType.findFirst).toHaveBeenCalledWith({
        where: { id: 'culture-2' },
      });
      expect(prismaService.crop.findFirst).toHaveBeenCalledWith({
        where: {
          seasonId: 'season-2',
          cultureTypeId: 'culture-2',
          id: { not: cropId },
        },
      });
    });

    it('should throw BadRequestException when trying to update with existing combination', async () => {
      const existingCrop = {
        id: cropId,
        seasonId: 'season-1',
        cultureTypeId: 'culture-1',
        plantedArea: 100.5,
      };

      const updateWithConflict: UpdateCropDto = {
        seasonId: 'season-2',
        cultureTypeId: 'culture-2',
      };

      const conflictingCrop = {
        id: 'different-crop-id',
        seasonId: 'season-2',
        cultureTypeId: 'culture-2',
      };

      mockPrismaService.crop.findFirst
        .mockResolvedValueOnce(existingCrop)
        .mockResolvedValueOnce(conflictingCrop);
      mockPrismaService.season.findFirst.mockResolvedValue({
        id: 'season-2',
        name: 'Safra 2025',
      });
      mockPrismaService.cultureType.findFirst.mockResolvedValue({
        id: 'culture-2',
        name: 'Milho',
      });

      await expect(service.update(cropId, updateWithConflict)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.crop.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const cropId = 'crop-id';

    it('should delete a crop successfully', async () => {
      const crop = {
        id: cropId,
        seasonId: 'season-1',
        cultureTypeId: 'culture-1',
        plantedArea: 100.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.crop.findFirst.mockResolvedValue(crop);
      mockPrismaService.crop.delete.mockResolvedValue(crop);

      const result = await service.remove(cropId);

      expect(prismaService.crop.findFirst).toHaveBeenCalledWith({
        where: { id: cropId },
        include: {
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
        },
      });
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
      const crops = [
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

      mockPrismaService.crop.findMany.mockResolvedValue(crops);

      const result = await service.findBySeasonId(seasonId);

      expect(prismaService.crop.findMany).toHaveBeenCalledWith({
        where: { seasonId },
        include: {
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
        },
      });
      expect(result).toEqual(crops);
    });
  });

  describe('findByCultureTypeId', () => {
    it('should return crops by culture type id', async () => {
      const cultureTypeId = 'culture-1';
      const crops = [
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

      mockPrismaService.crop.findMany.mockResolvedValue(crops);

      const result = await service.findByCultureTypeId(cultureTypeId);

      expect(prismaService.crop.findMany).toHaveBeenCalledWith({
        where: { cultureTypeId },
        include: {
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
        },
      });
      expect(result).toEqual(crops);
    });
  });
});
