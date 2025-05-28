import { Test, TestingModule } from '@nestjs/testing';
import { ProducerController } from './producer.controller';
import { ProducerService } from './producer.service';
import { CreateProducerDto } from './dto/create-producer.dto';
import { UpdateProducerDto } from './dto/update-producer.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { DocumentType } from '@prisma/client';

describe('ProducerController', () => {
  let controller: ProducerController;
  let service: ProducerService;

  const mockProducerService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getDashboard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProducerController],
      providers: [
        {
          provide: ProducerService,
          useValue: mockProducerService,
        },
      ],
    }).compile();

    controller = module.get<ProducerController>(ProducerController);
    service = module.get<ProducerService>(ProducerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a producer', async () => {
      const createProducerDto: CreateProducerDto = {
        document: '12345678901',
        documentType: DocumentType.CPF,
        name: 'João Silva',
      };

      const expectedResult = {
        id: 'producer-id',
        ...createProducerDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProducerService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createProducerDto);

      expect(service.create).toHaveBeenCalledWith(createProducerDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated producers', async () => {
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
            id: 'producer-1',
            document: '12345678901',
            documentType: DocumentType.CPF,
            name: 'João Silva',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        totalCountOfRegisters: 1,
        currentPage: 1,
      };

      mockProducerService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(paginationDto);

      expect(service.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a producer by id', async () => {
      const producerId = 'producer-id';
      const expectedResult = {
        id: producerId,
        document: '12345678901',
        documentType: DocumentType.CPF,
        name: 'João Silva',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProducerService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(producerId);

      expect(service.findOne).toHaveBeenCalledWith(producerId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a producer', async () => {
      const producerId = 'producer-id';
      const updateProducerDto: UpdateProducerDto = {
        name: 'João Silva Updated',
      };

      const expectedResult = {
        id: producerId,
        document: '12345678901',
        documentType: DocumentType.CPF,
        name: 'João Silva Updated',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProducerService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(producerId, updateProducerDto);

      expect(service.update).toHaveBeenCalledWith(producerId, updateProducerDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should delete a producer', async () => {
      const producerId = 'producer-id';
      const expectedResult = {
        id: producerId,
        document: '12345678901',
        documentType: DocumentType.CPF,
        name: 'João Silva',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProducerService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(producerId);

      expect(service.remove).toHaveBeenCalledWith(producerId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard statistics', async () => {
      const expectedResult = {
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
      };

      mockProducerService.getDashboard.mockResolvedValue(expectedResult);

      const result = await controller.getDashboard();

      expect(service.getDashboard).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });
});
