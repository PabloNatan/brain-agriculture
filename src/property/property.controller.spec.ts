import { Test, TestingModule } from '@nestjs/testing';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { DocumentType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('PropertyController', () => {
  let controller: PropertyController;
  let service: PropertyService;

  const mockPropertyService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByProducerId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyController],
      providers: [
        {
          provide: PropertyService,
          useValue: mockPropertyService,
        },
      ],
    }).compile();

    controller = module.get<PropertyController>(PropertyController);
    service = module.get<PropertyService>(PropertyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a property', async () => {
      const createPropertyDto: CreatePropertyDto = {
        name: 'Fazenda São João',
        city: 'Ribeirão Preto',
        state: 'SP',
        totalArea: 1000,
        arableArea: 800,
        vegetationArea: 200,
        producerId: 'producer-id-123',
      };

      const expectedResult = {
        id: 'property-id',
        ...createPropertyDto,
        totalArea: new Decimal(1000),
        arableArea: new Decimal(800),
        vegetationArea: new Decimal(200),
        createdAt: new Date(),
        updatedAt: new Date(),
        producer: {
          id: 'producer-id-123',
          name: 'João Silva',
          document: '12345678901',
          documentType: DocumentType.CPF,
        },
      };

      mockPropertyService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createPropertyDto);

      expect(service.create).toHaveBeenCalledWith(createPropertyDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated properties', async () => {
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
        ],
        totalCountOfRegisters: 1,
        currentPage: 1,
      };

      mockPropertyService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(paginationDto);

      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findByProducerId', () => {
    it('should return paginated properties by producer id', async () => {
      const producerId = 'producer-id-123';
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
        ],
        totalCountOfRegisters: 1,
        currentPage: 1,
      };

      mockPropertyService.findByProducerId.mockResolvedValue(expectedResult);

      const result = await controller.findByProducerId(
        producerId,
        paginationDto,
      );

      expect(service.findByProducerId).toHaveBeenCalledWith(
        producerId,
        paginationDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a property by id', async () => {
      const propertyId = 'property-id';
      const expectedResult = {
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

      mockPropertyService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(propertyId);

      expect(service.findOne).toHaveBeenCalledWith(propertyId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a property', async () => {
      const propertyId = 'property-id';
      const updatePropertyDto: UpdatePropertyDto = {
        name: 'Fazenda São João Updated',
      };

      const expectedResult = {
        id: propertyId,
        name: 'Fazenda São João Updated',
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
      };

      mockPropertyService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(propertyId, updatePropertyDto);

      expect(service.update).toHaveBeenCalledWith(
        propertyId,
        updatePropertyDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete a property', async () => {
      const propertyId = 'property-id';
      const expectedResult = {
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
      };

      mockPropertyService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(propertyId);

      expect(service.remove).toHaveBeenCalledWith(propertyId);
      expect(result).toEqual(expectedResult);
    });
  });
});
