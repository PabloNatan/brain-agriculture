import { Test, TestingModule } from '@nestjs/testing';
import { ProducerService } from './producer.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProducerDto } from './dto/create-producer.dto';
import { UpdateProducerDto } from './dto/update-producer.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { DocumentType } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ProducerService', () => {
  let service: ProducerService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    producer: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    property: {
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    crop: {
      groupBy: jest.fn(),
    },
    cultureType: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProducerService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProducerService>(ProducerService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createProducerDto: CreateProducerDto = {
      document: '11144477735',
      documentType: DocumentType.CPF,
      name: 'João Silva',
    };

    it('should create a producer successfully', async () => {
      const expectedResult = {
        id: 'producer-id',
        ...createProducerDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.producer.findFirst.mockResolvedValue(null);
      mockPrismaService.producer.create.mockResolvedValue(expectedResult);

      const result = await service.create(createProducerDto);

      expect(prismaService.producer.findFirst).toHaveBeenCalledWith({
        where: { document: createProducerDto.document },
      });
      expect(prismaService.producer.create).toHaveBeenCalledWith({
        data: createProducerDto,
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestException when document already exists', async () => {
      const existingProducer = {
        id: 'existing-id',
        document: '12345678901',
        documentType: DocumentType.CPF,
        name: 'Existing Producer',
      };

      mockPrismaService.producer.findFirst.mockResolvedValue(existingProducer);

      await expect(service.create(createProducerDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.producer.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid CPF', async () => {
      const invalidCpfDto = {
        ...createProducerDto,
        document: '12345678900',
      };

      mockPrismaService.producer.findFirst.mockResolvedValue(null);

      await expect(service.create(invalidCpfDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.producer.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid CNPJ', async () => {
      const invalidCnpjDto = {
        ...createProducerDto,
        document: '12345678000100',
        documentType: DocumentType.CNPJ,
      };

      mockPrismaService.producer.findFirst.mockResolvedValueOnce(null);

      await expect(service.create(invalidCnpjDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.producer.create).not.toHaveBeenCalled();
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

    it('should return paginated producers', async () => {
      const producers = [
        {
          id: 'producer-1',
          document: '12345678901',
          documentType: DocumentType.CPF,
          name: 'João Silva',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.producer.findMany.mockResolvedValue(producers);
      mockPrismaService.producer.count.mockResolvedValue(1);

      const result = await service.findAll(paginationDto);

      expect(prismaService.producer.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: '',
            mode: 'insensitive',
          },
        },
        skip: 0,
        take: 10,
        orderBy: paginationDto.orderBy,
      });
      expect(result).toEqual({
        data: producers,
        totalCountOfRegisters: 1,
        currentPage: 1,
      });
    });

    it('should apply filters correctly', async () => {
      const paginationWithFilters: PaginationDto = {
        ...paginationDto,
        filters: { name: 'João', document: '92980155004' },
      };

      mockPrismaService.producer.findMany.mockResolvedValue([]);
      mockPrismaService.producer.count.mockResolvedValue(0);

      await service.findAll(paginationWithFilters);

      expect(prismaService.producer.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'João',
            mode: 'insensitive',
          },
          document: {
            contains: '92980155004',
          },
        },
        skip: 0,
        take: 10,
        orderBy: paginationDto.orderBy,
      });
    });
  });

  describe('findOne', () => {
    it('should return a producer by id', async () => {
      const producerId = 'producer-id';
      const producer = {
        id: producerId,
        document: '12345678901',
        documentType: DocumentType.CPF,
        name: 'João Silva',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.producer.findFirst.mockResolvedValueOnce(producer);

      const result = await service.findOne(producerId);

      expect(prismaService.producer.findFirst).toHaveBeenCalledWith({
        where: { id: producerId },
      });
      expect(result).toEqual(producer);
    });

    it('should throw NotFoundException when producer not found', async () => {
      const producerId = 'non-existing-id';

      mockPrismaService.producer.findFirst.mockResolvedValueOnce(null);

      await expect(service.findOne(producerId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const producerId = 'producer-id';
    const updateProducerDto: UpdateProducerDto = {
      name: 'João Silva Updated',
    };

    it('should update a producer successfully', async () => {
      const existingProducer = {
        id: producerId,
        document: '12345678901',
        documentType: DocumentType.CPF,
        name: 'João Silva',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedProducer = {
        ...existingProducer,
        name: 'João Silva Updated',
      };

      mockPrismaService.producer.findFirst.mockResolvedValueOnce(
        existingProducer,
      );
      mockPrismaService.producer.update.mockResolvedValue(updatedProducer);

      const result = await service.update(producerId, updateProducerDto);

      expect(prismaService.producer.findFirst).toHaveBeenCalledWith({
        where: { id: producerId },
      });
      expect(prismaService.producer.update).toHaveBeenCalledWith({
        where: { id: producerId },
        data: updateProducerDto,
      });
      expect(result).toEqual(updatedProducer);
    });

    it('should throw NotFoundException when producer not found', async () => {
      mockPrismaService.producer.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.update(producerId, updateProducerDto),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.producer.update).not.toHaveBeenCalled();
    });

    it('should validate document when updating document fields', async () => {
      const existingProducer = {
        id: producerId,
        document: '92980155004',
        documentType: DocumentType.CPF,
        name: 'João Silva',
      };

      const updateWithDocument: UpdateProducerDto = {
        document: '92980155005',
        documentType: DocumentType.CPF,
      };

      mockPrismaService.producer.findFirst.mockResolvedValueOnce(
        existingProducer,
      );

      await expect(
        service.update(producerId, updateWithDocument),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    const producerId = 'producer-id';

    it('should delete a producer successfully', async () => {
      const producer = {
        id: producerId,
        document: '12345678901',
        documentType: DocumentType.CPF,
        name: 'João Silva',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.producer.findFirst.mockResolvedValueOnce(producer);
      mockPrismaService.producer.delete.mockResolvedValueOnce(producer);

      const result = await service.remove(producerId);

      expect(prismaService.producer.findFirst).toHaveBeenCalledWith({
        where: { id: producerId },
      });
      expect(prismaService.producer.delete).toHaveBeenCalledWith({
        where: { id: producerId },
      });
      expect(result).toEqual(producer);
    });

    it('should throw NotFoundException when producer not found', async () => {
      mockPrismaService.producer.findFirst.mockResolvedValueOnce(null);

      await expect(service.remove(producerId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.producer.delete).not.toHaveBeenCalled();
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard statistics', async () => {
      const mockData = {
        totalFarms: 10,
        totalHectares: 1000,
        farmsByState: [
          { state: 'SP', _count: { id: 5 } },
          { state: 'MG', _count: { id: 3 } },
        ],
        farmsByCulture: [
          { cultureTypeId: 'culture-1', _count: { id: 8 } },
          { cultureTypeId: 'culture-2', _count: { id: 2 } },
        ],
        cultureTypes: [
          { id: 'culture-1', name: 'Soja' },
          { id: 'culture-2', name: 'Milho' },
        ],
        landUse: {
          _sum: { arableArea: 600, vegetationArea: 400 },
        },
      };

      mockPrismaService.property.count.mockResolvedValue(mockData.totalFarms);
      mockPrismaService.property.aggregate
        .mockResolvedValueOnce({ _sum: { totalArea: mockData.totalHectares } })
        .mockResolvedValueOnce(mockData.landUse);
      mockPrismaService.property.groupBy.mockResolvedValue(
        mockData.farmsByState,
      );
      mockPrismaService.crop.groupBy.mockResolvedValue(mockData.farmsByCulture);
      mockPrismaService.cultureType.findMany.mockResolvedValue(
        mockData.cultureTypes,
      );

      const result = await service.getDashboard();

      expect(result).toEqual({
        totalFarms: 10,
        totalHectares: 1000,
        charts: {
          farmsByState: [
            { state: 'SP', count: 5 },
            { state: 'MG', count: 3 },
          ],
          farmsByCulture: [
            { culture: 'Soja', count: 8 },
            { culture: 'Milho', count: 2 },
          ],
          landUse: [
            { type: 'Área Agricultável', value: 600 },
            { type: 'Área de Vegetação', value: 400 },
          ],
        },
      });
    });
  });
});
