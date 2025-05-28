import { Test, TestingModule } from '@nestjs/testing';
import { CultureTypeService } from './culture-type.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCultureTypeDto } from './dto/create-culture-type.dto';
import { UpdateCultureTypeDto } from './dto/update-culture-type.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

describe('CultureTypeService', () => {
  let service: CultureTypeService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    cultureType: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CultureTypeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CultureTypeService>(CultureTypeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createCultureTypeDto: CreateCultureTypeDto = {
      title: 'Soja',
      name: 'soja',
    };

    it('should create a culture type successfully', async () => {
      const expectedResult = { id: '1', ...createCultureTypeDto };

      mockPrismaService.cultureType.findFirst.mockResolvedValue(null);
      mockPrismaService.cultureType.create.mockResolvedValue(expectedResult);

      const result = await service.create(createCultureTypeDto);

      expect(mockPrismaService.cultureType.findFirst).toHaveBeenCalledWith({
        where: { name: createCultureTypeDto.name },
      });
      expect(mockPrismaService.cultureType.create).toHaveBeenCalledWith({
        data: createCultureTypeDto,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestException if name already exists', async () => {
      const existingCultureType = { id: '1', ...createCultureTypeDto };

      mockPrismaService.cultureType.findFirst.mockResolvedValue(existingCultureType);

      await expect(service.create(createCultureTypeDto)).rejects.toThrow(
        new BadRequestException('Culture type with this name already exists'),
      );

      expect(mockPrismaService.cultureType.create).not.toHaveBeenCalled();
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
      const mockData = [
        { id: '1', title: 'Soja', name: 'soja', _count: { crops: 5 } },
        { id: '2', title: 'Milho', name: 'milho', _count: { crops: 3 } },
      ];
      const totalCount = 2;

      mockPrismaService.cultureType.findMany.mockResolvedValue(mockData);
      mockPrismaService.cultureType.count.mockResolvedValue(totalCount);

      const result = await service.findAll(paginationDto);

      expect(mockPrismaService.cultureType.findMany).toHaveBeenCalledWith({
        where: { title: { contains: '', mode: 'insensitive' } },
        skip: 0,
        take: 10,
        orderBy: undefined,
        include: { _count: { select: { crops: true } } },
      });
      expect(mockPrismaService.cultureType.count).toHaveBeenCalledWith({
        where: { title: { contains: '', mode: 'insensitive' } },
      });
      expect(result).toEqual({
        data: mockData,
        totalCountOfRegisters: totalCount,
        currentPage: 1,
      });
    });

    it('should apply filters correctly', async () => {
      const paginationWithFilters: PaginationDto = {
        currentPage: 1,
        registersPerPage: 10,
        'order[order]': 'asc' as const,
        filters: { title: 'Soja', name: 'soja' },
      };

      mockPrismaService.cultureType.findMany.mockResolvedValue([]);
      mockPrismaService.cultureType.count.mockResolvedValue(0);

      await service.findAll(paginationWithFilters);

      expect(mockPrismaService.cultureType.findMany).toHaveBeenCalledWith({
        where: {
          title: { contains: 'Soja', mode: 'insensitive' },
          name: { contains: 'soja', mode: 'insensitive' },
        },
        skip: 0,
        take: 10,
        orderBy: undefined,
        include: { _count: { select: { crops: true } } },
      });
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
      mockPrismaService.cultureType.findFirst.mockResolvedValue(mockCultureType);

      const result = await service.findOne('1');

      expect(mockPrismaService.cultureType.findFirst).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { _count: { select: { crops: true } } },
      });
      expect(result).toEqual(mockCultureType);
    });

    it('should throw NotFoundException if culture type not found', async () => {
      mockPrismaService.cultureType.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        new NotFoundException('Culture type not found'),
      );
    });
  });

  describe('update', () => {
    const updateCultureTypeDto: UpdateCultureTypeDto = {
      title: 'Updated Soja',
      name: 'updated-soja',
    };

    const existingCultureType = {
      id: '1',
      title: 'Soja',
      name: 'soja',
      _count: { crops: 5 },
    };

    it('should update a culture type successfully', async () => {
      const updatedCultureType = { ...existingCultureType, ...updateCultureTypeDto };

      mockPrismaService.cultureType.findFirst
        .mockResolvedValueOnce(existingCultureType)
        .mockResolvedValueOnce(null);
      mockPrismaService.cultureType.update.mockResolvedValue(updatedCultureType);

      const result = await service.update('1', updateCultureTypeDto);

      expect(mockPrismaService.cultureType.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateCultureTypeDto,
      });
      expect(result).toEqual(updatedCultureType);
    });

    it('should throw NotFoundException if culture type not found', async () => {
      mockPrismaService.cultureType.findFirst.mockResolvedValue(null);

      await expect(service.update('non-existent', updateCultureTypeDto)).rejects.toThrow(
        new NotFoundException('Culture type not found'),
      );

      expect(mockPrismaService.cultureType.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if name already exists', async () => {
      const anotherCultureType = { id: '2', title: 'Another', name: 'updated-soja' };

      mockPrismaService.cultureType.findFirst
        .mockResolvedValueOnce(existingCultureType)
        .mockResolvedValueOnce(anotherCultureType);

      await expect(service.update('1', updateCultureTypeDto)).rejects.toThrow(
        new BadRequestException('Culture type with this name already exists'),
      );

      expect(mockPrismaService.cultureType.update).not.toHaveBeenCalled();
    });

    it('should not check name availability if name is not provided', async () => {
      const updateDto = { title: 'Updated Title' };
      const updatedCultureType = { ...existingCultureType, ...updateDto };

      mockPrismaService.cultureType.findFirst.mockResolvedValueOnce(existingCultureType);
      mockPrismaService.cultureType.update.mockResolvedValue(updatedCultureType);

      const result = await service.update('1', updateDto);

      expect(mockPrismaService.cultureType.findFirst).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedCultureType);
    });
  });

  describe('remove', () => {
    const existingCultureType = {
      id: '1',
      title: 'Soja',
      name: 'soja',
      _count: { crops: 0 },
    };

    it('should delete a culture type successfully', async () => {
      mockPrismaService.cultureType.findFirst.mockResolvedValue(existingCultureType);
      mockPrismaService.cultureType.delete.mockResolvedValue(existingCultureType);

      const result = await service.remove('1');

      expect(mockPrismaService.cultureType.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(existingCultureType);
    });

    it('should throw NotFoundException if culture type not found', async () => {
      mockPrismaService.cultureType.findFirst.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        new NotFoundException('Culture type not found'),
      );

      expect(mockPrismaService.cultureType.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if culture type is being used in crops', async () => {
      const cultureTypeWithCrops = {
        ...existingCultureType,
        _count: { crops: 5 },
      };

      mockPrismaService.cultureType.findFirst.mockResolvedValue(cultureTypeWithCrops);

      await expect(service.remove('1')).rejects.toThrow(
        new BadRequestException('Cannot delete culture type that is being used in crops'),
      );

      expect(mockPrismaService.cultureType.delete).not.toHaveBeenCalled();
    });
  });

  describe('verifyIfNameIsAvailable (private method)', () => {
    it('should not throw if name is available for create', async () => {
      mockPrismaService.cultureType.findFirst.mockResolvedValue(null);

      await expect(service['verifyIfNameIsAvailable']('new-name')).resolves.not.toThrow();
    });

    it('should not throw if name is available for update (excluding current id)', async () => {
      mockPrismaService.cultureType.findFirst.mockResolvedValue(null);

      await expect(service['verifyIfNameIsAvailable']('existing-name', '1')).resolves.not.toThrow();

      expect(mockPrismaService.cultureType.findFirst).toHaveBeenCalledWith({
        where: {
          name: 'existing-name',
          id: { not: '1' },
        },
      });
    });
  });
});
