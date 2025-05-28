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
    const createSeasonDto: CreateSeasonDto = {
      name: 'Safra 2024',
      year: 2024,
      propertyId: 'cmb872puz0000rxt91c1maoy8',
    };

    it('should create a season successfully', async () => {
      const expectedResult = {
        id: 'season-id',
        ...createSeasonDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        property: {
          id: 'cmb872puz0000rxt91c1maoy8',
          name: 'Farm Test',
        },
        crops: [],
      };

      mockPrismaService.property.findFirst.mockResolvedValue({
        id: 'cmb872puz0000rxt91c1maoy8',
      });
      mockPrismaService.season.findFirst.mockResolvedValue(null);
      mockPrismaService.season.create.mockResolvedValue(expectedResult);

      const result = await service.create(createSeasonDto);

      expect(prismaService.property.findFirst).toHaveBeenCalledWith({
        where: { id: createSeasonDto.propertyId },
      });
      expect(prismaService.season.findFirst).toHaveBeenCalledWith({
        where: {
          propertyId: createSeasonDto.propertyId,
          name: createSeasonDto.name,
          year: createSeasonDto.year,
        },
      });
      expect(prismaService.season.create).toHaveBeenCalledWith({
        data: createSeasonDto,
        include: {
          property: true,
          crops: {
            include: {
              cultureType: true,
            },
          },
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestException when property not found', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(null);

      await expect(service.create(createSeasonDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.season.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when season already exists', async () => {
      const existingSeason = {
        id: 'existing-id',
        name: 'Safra 2024',
        year: 2024,
        propertyId: 'cmb872puz0000rxt91c1maoy8',
      };

      mockPrismaService.property.findFirst.mockResolvedValue({
        id: 'cmb872puz0000rxt91c1maoy8',
      });
      mockPrismaService.season.findFirst.mockResolvedValue(existingSeason);

      await expect(service.create(createSeasonDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.season.create).not.toHaveBeenCalled();
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

    it('should return paginated seasons', async () => {
      const seasons = [
        {
          id: 'season-1',
          name: 'Safra 2024',
          year: 2024,
          propertyId: 'cmb872puz0000rxt91c1maoy8',
          createdAt: new Date(),
          updatedAt: new Date(),
          property: { id: 'cmb872puz0000rxt91c1maoy8', name: 'Farm Test' },
          crops: [],
        },
      ];

      mockPrismaService.season.findMany.mockResolvedValue(seasons);
      mockPrismaService.season.count.mockResolvedValue(1);

      const result = await service.findAll(paginationDto);

      expect(prismaService.season.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: paginationDto.orderBy,
        include: {
          property: true,
          crops: {
            include: {
              cultureType: true,
            },
          },
        },
      });
      expect(result).toEqual({
        data: seasons,
        totalCountOfRegisters: 1,
        currentPage: 1,
      });
    });

    it('should apply filters correctly', async () => {
      const paginationWithFilters: PaginationDto = {
        ...paginationDto,
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
        orderBy: paginationDto.orderBy,
        include: {
          property: true,
          crops: {
            include: {
              cultureType: true,
            },
          },
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a season by id', async () => {
      const seasonId = 'season-id';
      const season = {
        id: seasonId,
        name: 'Safra 2024',
        year: 2024,
        propertyId: 'cmb872puz0000rxt91c1maoy8',
        createdAt: new Date(),
        updatedAt: new Date(),
        property: { id: 'cmb872puz0000rxt91c1maoy8', name: 'Farm Test' },
        crops: [],
      };

      mockPrismaService.season.findFirst.mockResolvedValue(season);

      const result = await service.findOne(seasonId);

      expect(prismaService.season.findFirst).toHaveBeenCalledWith({
        where: { id: seasonId },
        include: {
          property: true,
          crops: {
            include: {
              cultureType: true,
            },
          },
        },
      });
      expect(result).toEqual(season);
    });

    it('should throw NotFoundException when season not found', async () => {
      const seasonId = 'non-existing-id';

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
        {
          id: 'season-1',
          name: 'Safra 2024',
          year: 2024,
          propertyId,
          property: { id: propertyId, name: 'Farm Test' },
          crops: [],
        },
      ];

      mockPrismaService.property.findFirst.mockResolvedValue({
        id: propertyId,
      });
      mockPrismaService.season.findMany.mockResolvedValue(seasons);

      const result = await service.findByProperty(propertyId);

      expect(prismaService.property.findFirst).toHaveBeenCalledWith({
        where: { id: propertyId },
      });
      expect(prismaService.season.findMany).toHaveBeenCalledWith({
        where: { propertyId },
        include: {
          property: true,
          crops: {
            include: {
              cultureType: true,
            },
          },
        },
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
    const updateSeasonDto: UpdateSeasonDto = {
      name: 'Safra 2024 Updated',
    };

    it('should update a season successfully', async () => {
      const existingSeason = {
        id: seasonId,
        name: 'Safra 2024',
        year: 2024,
        propertyId: 'cmb872puz0000rxt91c1maoy8',
        createdAt: new Date(),
        updatedAt: new Date(),
        property: { id: 'cmb872puz0000rxt91c1maoy8', name: 'Farm Test' },
        crops: [],
      };

      const updatedSeason = {
        ...existingSeason,
        name: 'Safra 2024 Updated',
      };

      mockPrismaService.season.findFirst
        .mockResolvedValueOnce(existingSeason)
        .mockResolvedValueOnce(null);

      mockPrismaService.season.update.mockResolvedValue(updatedSeason);

      const result = await service.update(seasonId, updateSeasonDto);

      expect(prismaService.season.findFirst).toHaveBeenCalledWith({
        where: { id: seasonId },
        include: {
          property: true,
          crops: {
            include: {
              cultureType: true,
            },
          },
        },
      });
      expect(prismaService.season.update).toHaveBeenCalledWith({
        where: { id: seasonId },
        data: updateSeasonDto,
        include: {
          property: true,
          crops: {
            include: {
              cultureType: true,
            },
          },
        },
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
      const existingSeason = {
        id: seasonId,
        name: 'Safra 2024',
        year: 2024,
        propertyId: 'cmb872puz0000rxt91c1maoy8',
      };

      const updateWithDuplicate: UpdateSeasonDto = {
        name: 'Existing Season',
        year: 2024,
      };

      const duplicateSeason = {
        id: 'other-season-id',
        name: 'Existing Season',
        year: 2024,
        propertyId: 'cmb872puz0000rxt91c1maoy8',
      };

      mockPrismaService.season.findFirst
        .mockResolvedValueOnce({
          ...existingSeason,
          property: { id: 'cmb872puz0000rxt91c1maoy8', name: 'Farm Test' },
          crops: [],
        })
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
      const season = {
        id: seasonId,
        name: 'Safra 2024',
        year: 2024,
        propertyId: 'cmb872puz0000rxt91c1maoy8',
        createdAt: new Date(),
        updatedAt: new Date(),
        property: { id: 'cmb872puz0000rxt91c1maoy8', name: 'Farm Test' },
        crops: [],
      };

      mockPrismaService.season.findFirst.mockResolvedValue(season);
      mockPrismaService.season.delete.mockResolvedValue(season);

      const result = await service.remove(seasonId);

      expect(prismaService.season.findFirst).toHaveBeenCalledWith({
        where: { id: seasonId },
        include: {
          property: true,
          crops: {
            include: {
              cultureType: true,
            },
          },
        },
      });
      expect(prismaService.season.delete).toHaveBeenCalledWith({
        where: { id: seasonId },
        include: {
          property: true,
          crops: {
            include: {
              cultureType: true,
            },
          },
        },
      });
      expect(result).toEqual(season);
    });

    it('should throw NotFoundException when season not found', async () => {
      mockPrismaService.season.findFirst.mockResolvedValue(null);

      await expect(service.remove(seasonId)).rejects.toThrow(NotFoundException);
      expect(prismaService.season.delete).not.toHaveBeenCalled();
    });
  });
});
