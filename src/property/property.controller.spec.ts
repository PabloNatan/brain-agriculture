import { Test, TestingModule } from '@nestjs/testing';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { DocumentType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { AttachCultureDto } from './dto/attach-culture.dto';

describe('PropertyController', () => {
  let controller: PropertyController;
  let service: PropertyService;

  // Test data factories
  const createMockProducer = (overrides = {}) => ({
    id: 'producer-id-123',
    name: 'João Silva',
    document: '12345678901',
    documentType: DocumentType.CPF,
    ...overrides,
  });

  const createMockProperty = (overrides = {}) => ({
    id: 'property-id',
    name: 'Fazenda São João',
    city: 'Ribeirão Preto',
    state: 'SP',
    totalArea: new Decimal(1000),
    arableArea: new Decimal(800),
    vegetationArea: new Decimal(200),
    producerId: 'producer-id-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    producer: createMockProducer(),
    ...overrides,
  });

  const createMockCulture = (overrides = {}) => ({
    id: 'culture-type-id-123',
    name: 'soja',
    title: 'Soja',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockPaginatedResponse = (data: any[], overrides = {}) => ({
    data,
    totalCountOfRegisters: data.length,
    currentPage: 1,
    ...overrides,
  });

  // Shared DTOs
  const createPropertyDto: CreatePropertyDto = {
    name: 'Fazenda São João',
    city: 'Ribeirão Preto',
    state: 'SP',
    totalArea: 1000,
    arableArea: 800,
    vegetationArea: 200,
    producerId: 'producer-id-123',
  };

  const defaultPaginationDto: PaginationDto = {
    currentPage: 1,
    registersPerPage: 10,
    'order[order]': 'asc' as const,
    orderBy: { id: 'asc' },
    filters: {},
  };

  const attachCultureDto: AttachCultureDto = {
    cultureTypeId: 'culture-type-id-123',
  };

  // Constants
  const PROPERTY_ID = 'property-id';
  const PRODUCER_ID = 'producer-id-123';

  const mockPropertyService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByProducerId: jest.fn(),
    attachCultureToProperty: jest.fn(),
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
      const expectedResult = createMockProperty();

      mockPropertyService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createPropertyDto);

      expect(service.create).toHaveBeenCalledWith(createPropertyDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated properties', async () => {
      const mockPropertyWithExtras = createMockProperty({
        id: 'property-1',
        seasons: [],
        _count: { seasons: 0 },
      });

      const expectedResult = createMockPaginatedResponse([
        mockPropertyWithExtras,
      ]);

      mockPropertyService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(defaultPaginationDto);

      expect(service.findAll).toHaveBeenCalledWith(defaultPaginationDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findByProducerId', () => {
    it('should return paginated properties by producer id', async () => {
      const mockPropertyForProducer = createMockProperty({
        id: 'property-1',
        producerId: PRODUCER_ID,
        seasons: [],
        _count: { seasons: 0 },
        producer: undefined, // Remove producer object for this response
      });

      const expectedResult = createMockPaginatedResponse([
        mockPropertyForProducer,
      ]);

      mockPropertyService.findByProducerId.mockResolvedValue(expectedResult);

      const result = await controller.findByProducerId(
        PRODUCER_ID,
        defaultPaginationDto,
      );

      expect(service.findByProducerId).toHaveBeenCalledWith(
        PRODUCER_ID,
        defaultPaginationDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a property by id', async () => {
      const expectedResult = createMockProperty({
        id: PROPERTY_ID,
        seasons: [],
      });

      mockPropertyService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(PROPERTY_ID);

      expect(service.findOne).toHaveBeenCalledWith(PROPERTY_ID);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a property', async () => {
      const updatePropertyDto: UpdatePropertyDto = {
        name: 'Fazenda São João Updated',
      };

      const expectedResult = createMockProperty({
        id: PROPERTY_ID,
        name: 'Fazenda São João Updated',
      });

      mockPropertyService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(PROPERTY_ID, updatePropertyDto);

      expect(service.update).toHaveBeenCalledWith(
        PROPERTY_ID,
        updatePropertyDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete a property', async () => {
      const expectedResult = createMockProperty({
        id: PROPERTY_ID,
      });

      mockPropertyService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(PROPERTY_ID);

      expect(service.remove).toHaveBeenCalledWith(PROPERTY_ID);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('attachCultureToProperty', () => {
    it('should attach culture to property successfully', async () => {
      const expectedResult = createMockProperty({
        id: PROPERTY_ID,
        cultures: [createMockCulture()],
      });

      mockPropertyService.attachCultureToProperty.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.attachCultureToProperty(
        PROPERTY_ID,
        attachCultureDto,
      );

      expect(service.attachCultureToProperty).toHaveBeenCalledWith(
        PROPERTY_ID,
        attachCultureDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
