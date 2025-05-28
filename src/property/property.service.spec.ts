import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { DocumentType } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PropertyService } from './property.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('PropertyService', () => {
  let service: PropertyService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    property: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    producer: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PropertyService>(PropertyService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createPropertyDto: CreatePropertyDto = {
      name: 'Fazenda São João',
      city: 'Ribeirão Preto',
      state: 'SP',
      totalArea: 1000,
      arableArea: 800,
      vegetationArea: 200,
      producerId: 'producer-id-123',
    };

    const mockProducer = {
      id: 'producer-id-123',
      name: 'João Silva',
      document: '12345678901',
      documentType: DocumentType.CPF,
    };

    it('should create a property successfully', async () => {
      const expectedResult = {
        id: 'property-id',
        ...createPropertyDto,
        totalArea: new Decimal(1000),
        arableArea: new Decimal(800),
        vegetationArea: new Decimal(200),
        createdAt: new Date(),
        updatedAt: new Date(),
        producer: mockProducer,
      };

      mockPrismaService.producer.findFirst.mockResolvedValue(mockProducer);
      mockPrismaService.property.create.mockResolvedValue(expectedResult);

      const result = await service.create(createPropertyDto);

      expect(prismaService.producer.findFirst).toHaveBeenCalledWith({
        where: { id: createPropertyDto.producerId },
      });
      expect(prismaService.property.create).toHaveBeenCalledWith({
        data: {
          ...createPropertyDto,
          totalArea: new Decimal(createPropertyDto.totalArea),
          arableArea: new Decimal(createPropertyDto.arableArea),
          vegetationArea: new Decimal(createPropertyDto.vegetationArea),
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw BadRequestException when producer not found', async () => {
      mockPrismaService.producer.findFirst.mockResolvedValue(null);

      await expect(service.create(createPropertyDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.property.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when areas exceed total area', async () => {
      const invalidDto = {
        ...createPropertyDto,
        arableArea: 900,
        vegetationArea: 200, // 900 + 200 = 1100 > 1000
      };

      mockPrismaService.producer.findFirst.mockResolvedValue(mockProducer);

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.property.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for negative area values', async () => {
      const invalidDto = {
        ...createPropertyDto,
        arableArea: -100,
      };

      mockPrismaService.producer.findFirst.mockResolvedValue(mockProducer);

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.property.create).not.toHaveBeenCalled();
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

    it('should return paginated properties', async () => {
      const properties = [
        {
          id: 'property-1',
          name: 'Fazenda São João',
          city: 'Ribeirão Preto',
          state: 'SP',
          totalArea: new Decimal(1000),
          arableArea: new Decimal(800),
          vegetationArea: new Decimal(200),
          producerId: 'producer-id-123',
          createdAt: new Date(),
          updatedAt: new Date(),
          producer: {
            id: 'producer-id-123',
            name: 'João Silva',
            document: '12345678901',
            documentType: DocumentType.CPF,
          },
          seasons: [],
          _count: { seasons: 0 },
        },
      ];

      mockPrismaService.property.findMany.mockResolvedValue(properties);
      mockPrismaService.property.count.mockResolvedValue(1);

      const result = await service.findAll(paginationDto);

      expect(prismaService.property.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: paginationDto.orderBy,
      });
      expect(result).toEqual({
        data: properties,
        totalCountOfRegisters: 1,
        currentPage: 1,
      });
    });

    it('should apply filters correctly', async () => {
      const paginationWithFilters: PaginationDto = {
        ...paginationDto,
        filters: { name: 'São João', city: 'Ribeirão', state: 'SP' },
      };

      mockPrismaService.property.findMany.mockResolvedValue([]);
      mockPrismaService.property.count.mockResolvedValue(0);

      await service.findAll(paginationWithFilters);

      expect(prismaService.property.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'São João',
            mode: 'insensitive',
          },
          city: {
            contains: 'Ribeirão',
            mode: 'insensitive',
          },
          state: {
            contains: 'SP',
            mode: 'insensitive',
          },
        },
        skip: 0,
        take: 10,
        orderBy: paginationDto.orderBy,
      });
    });
  });

  describe('findOne', () => {
    it('should return a property by id', async () => {
      const propertyId = 'property-id';
      const property = {
        id: propertyId,
        name: 'Fazenda São João',
        city: 'Ribeirão Preto',
        state: 'SP',
        totalArea: new Decimal(1000),
        arableArea: new Decimal(800),
        vegetationArea: new Decimal(200),
        producerId: 'producer-id-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        producer: {
          id: 'producer-id-123',
          name: 'João Silva',
          document: '12345678901',
          documentType: DocumentType.CPF,
        },
        seasons: [],
      };

      mockPrismaService.property.findFirst.mockResolvedValue(property);

      const result = await service.findOne(propertyId);

      expect(prismaService.property.findFirst).toHaveBeenCalledWith({
        where: { id: propertyId },
        include: {
          producer: {
            select: {
              id: true,
              name: true,
              document: true,
              documentType: true,
            },
          },
          seasons: {
            include: {
              crops: {
                include: {
                  cultureType: true,
                },
              },
            },
          },
          cultures: {
            select: {
              id: true,
              name: true,
              title: true,
            },
          },
        },
      });
      expect(result).toEqual(property);
    });

    it('should throw NotFoundException when property not found', async () => {
      const propertyId = 'non-existing-id';

      mockPrismaService.property.findFirst.mockResolvedValue(null);

      await expect(service.findOne(propertyId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const propertyId = 'property-id';
    const updatePropertyDto: UpdatePropertyDto = {
      name: 'Fazenda São João Updated',
    };

    const existingProperty = {
      id: propertyId,
      name: 'Fazenda São João',
      city: 'Ribeirão Preto',
      state: 'SP',
      totalArea: new Decimal(1000),
      arableArea: new Decimal(800),
      vegetationArea: new Decimal(200),
      producerId: 'producer-id-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      producer: {
        id: 'producer-id-123',
        name: 'João Silva',
        document: '12345678901',
        documentType: DocumentType.CPF,
      },
      seasons: [],
    };

    it('should update a property successfully', async () => {
      const updatedProperty = {
        ...existingProperty,
        name: 'Fazenda São João Updated',
      };

      mockPrismaService.property.findFirst.mockResolvedValue(existingProperty);
      mockPrismaService.property.update.mockResolvedValue(updatedProperty);

      const result = await service.update(propertyId, updatePropertyDto);

      expect(result).toEqual(updatedProperty);
    });

    it('should throw NotFoundException when property not found', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(null);

      await expect(
        service.update(propertyId, updatePropertyDto),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.property.update).not.toHaveBeenCalled();
    });

    it('should validate producer when updating producerId', async () => {
      const updateWithProducer: UpdatePropertyDto = {
        producerId: 'new-producer-id',
      };

      const mockNewProducer = {
        id: 'new-producer-id',
        name: 'Maria Silva',
        document: '98765432109',
        documentType: DocumentType.CPF,
      };

      mockPrismaService.property.findFirst.mockResolvedValue(existingProperty);
      mockPrismaService.producer.findFirst.mockResolvedValue(mockNewProducer);
      mockPrismaService.property.update.mockResolvedValue({
        ...existingProperty,
        producerId: 'new-producer-id',
      });

      await service.update(propertyId, updateWithProducer);

      expect(prismaService.producer.findFirst).toHaveBeenCalledWith({
        where: { id: 'new-producer-id' },
      });
    });

    it('should validate area constraints when updating areas', async () => {
      const updateWithInvalidAreas: UpdatePropertyDto = {
        arableArea: 900,
        vegetationArea: 300, // 900 + 300 = 1200 > 1000
      };

      mockPrismaService.property.findFirst.mockResolvedValue(existingProperty);

      await expect(
        service.update(propertyId, updateWithInvalidAreas),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    const propertyId = 'property-id';
    const property = {
      id: propertyId,
      name: 'Fazenda São João',
      city: 'Ribeirão Preto',
      state: 'SP',
      totalArea: new Decimal(1000),
      arableArea: new Decimal(800),
      vegetationArea: new Decimal(200),
      producerId: 'producer-id-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      producer: {
        id: 'producer-id-123',
        name: 'João Silva',
        document: '12345678901',
        documentType: DocumentType.CPF,
      },
      seasons: [],
    };

    it('should delete a property successfully', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(property);
      mockPrismaService.property.delete.mockResolvedValue(property);

      const result = await service.remove(propertyId);

      expect(prismaService.property.findFirst).toHaveBeenCalledWith({
        where: { id: propertyId },
        include: {
          producer: {
            select: {
              id: true,
              name: true,
              document: true,
              documentType: true,
            },
          },
          seasons: {
            include: {
              crops: {
                include: {
                  cultureType: true,
                },
              },
            },
          },
          cultures: {
            select: {
              id: true,
              name: true,
              title: true,
            },
          },
        },
      });
      expect(prismaService.property.delete).toHaveBeenCalledWith({
        where: { id: propertyId },
      });
      expect(result).toEqual(property);
    });

    it('should throw NotFoundException when property not found', async () => {
      mockPrismaService.property.findFirst.mockResolvedValue(null);

      await expect(service.remove(propertyId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.property.delete).not.toHaveBeenCalled();
    });
  });

  describe('findByProducerId', () => {
    const producerId = 'producer-id-123';
    const mockProducer = {
      id: producerId,
      name: 'João Silva',
      document: '12345678901',
      documentType: DocumentType.CPF,
    };

    const paginationDto: PaginationDto = {
      currentPage: 1,
      'order[order]': 'asc',
      registersPerPage: 10,
      orderBy: { id: 'asc' },
      filters: {},
    };

    it('should return properties by producer id', async () => {
      const properties = [
        {
          id: 'property-1',
          name: 'Fazenda São João',
          city: 'Ribeirão Preto',
          state: 'SP',
          totalArea: new Decimal(1000),
          arableArea: new Decimal(800),
          vegetationArea: new Decimal(200),
          producerId,
          createdAt: new Date(),
          updatedAt: new Date(),
          seasons: [],
          _count: { seasons: 0 },
        },
      ];

      mockPrismaService.producer.findFirst.mockResolvedValue(mockProducer);
      mockPrismaService.property.findMany.mockResolvedValue(properties);
      mockPrismaService.property.count.mockResolvedValue(1);

      const result = await service.findByProducerId(producerId, paginationDto);

      expect(prismaService.producer.findFirst).toHaveBeenCalledWith({
        where: { id: producerId },
      });
      expect(prismaService.property.findMany).toHaveBeenCalledWith({
        where: { producerId },
        skip: 0,
        take: 10,
        orderBy: paginationDto.orderBy,
      });
      expect(result).toEqual({
        data: properties,
        totalCountOfRegisters: 1,
        currentPage: 1,
      });
    });

    it('should throw BadRequestException when producer not found', async () => {
      mockPrismaService.producer.findFirst.mockResolvedValue(null);

      await expect(
        service.findByProducerId(producerId, paginationDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
