import { Test, TestingModule } from '@nestjs/testing';
import { SeasonController } from './season.controller';
import { SeasonService } from './season.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

describe('SeasonController', () => {
  let controller: SeasonController;
  let service: SeasonService;

  const mockSeasonService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByProperty: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  // Test data factories
  const createMockProperty = (id = 'property-id', name = 'Farm Test') => ({
    id,
    name,
  });

  const createMockCrop = (overrides = {}) => ({
    id: 'crop-1',
    cultureType: {
      name: 'Soja',
    },
    ...overrides,
  });

  const createMockSeason = (overrides = {}) => ({
    id: 'season-id',
    name: 'Safra 2024',
    year: 2024,
    propertyId: 'property-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    property: createMockProperty(),
    crops: [],
    ...overrides,
  });

  const createMockPaginatedResponse = (
    data = [createMockSeason()],
    totalCount = 1,
  ) => ({
    data,
    totalCountOfRegisters: totalCount,
    currentPage: 1,
  });

  // Test DTOs
  const createSeasonDto: CreateSeasonDto = {
    name: 'Safra 2024',
    year: 2024,
    propertyId: 'property-id',
  };

  const basePaginationDto: PaginationDto = {
    currentPage: 1,
    registersPerPage: 10,
    'order[order]': 'asc' as const,
    orderBy: { id: 'asc' },
    filters: {},
  };

  const updateSeasonDto: UpdateSeasonDto = {
    name: 'Safra 2024 Updated',
  };

  // Helper function to test controller method delegation
  const testControllerDelegation = async (
    controllerMethod: Function,
    serviceMethod: jest.Mock,
    methodArgs: any[],
    expectedResult: any,
  ) => {
    serviceMethod.mockResolvedValue(expectedResult);

    const result = await controllerMethod(...methodArgs);

    expect(serviceMethod).toHaveBeenCalledWith(...methodArgs);
    expect(result).toEqual(expectedResult);
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeasonController],
      providers: [
        {
          provide: SeasonService,
          useValue: mockSeasonService,
        },
      ],
    }).compile();

    controller = module.get<SeasonController>(SeasonController);
    service = module.get<SeasonService>(SeasonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a season', async () => {
      const expectedResult = createMockSeason();

      await testControllerDelegation(
        controller.create.bind(controller),
        mockSeasonService.create,
        [createSeasonDto],
        expectedResult,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated seasons', async () => {
      const expectedResult = createMockPaginatedResponse([
        createMockSeason({ id: 'season-1' }),
      ]);

      await testControllerDelegation(
        controller.findAll.bind(controller),
        mockSeasonService.findAll,
        [basePaginationDto],
        expectedResult,
      );
    });
  });

  describe('findByProperty', () => {
    it('should return seasons for a specific property', async () => {
      const propertyId = 'property-id';
      const expectedResult = [createMockSeason({ id: 'season-1', propertyId })];

      await testControllerDelegation(
        controller.findByProperty.bind(controller),
        mockSeasonService.findByProperty,
        [propertyId],
        expectedResult,
      );
    });
  });

  describe('findOne', () => {
    it('should return a season by id', async () => {
      const seasonId = 'season-id';
      const expectedResult = createMockSeason({ id: seasonId });

      await testControllerDelegation(
        controller.findOne.bind(controller),
        mockSeasonService.findOne,
        [seasonId],
        expectedResult,
      );
    });
  });

  describe('update', () => {
    it('should update a season', async () => {
      const seasonId = 'season-id';
      const expectedResult = createMockSeason({
        id: seasonId,
        name: updateSeasonDto.name,
      });

      await testControllerDelegation(
        controller.update.bind(controller),
        mockSeasonService.update,
        [seasonId, updateSeasonDto],
        expectedResult,
      );
    });
  });

  describe('remove', () => {
    it('should delete a season', async () => {
      const seasonId = 'season-id';
      const expectedResult = createMockSeason({ id: seasonId });

      await testControllerDelegation(
        controller.remove.bind(controller),
        mockSeasonService.remove,
        [seasonId],
        expectedResult,
      );
    });
  });

  // Alternative approach using parameterized tests for CRUD operations
  describe('CRUD operations delegation', () => {
    it.each([
      {
        method: 'create',
        args: [createSeasonDto],
        expectedResult: createMockSeason(),
      },
      {
        method: 'findOne',
        args: ['season-id'],
        expectedResult: createMockSeason({ id: 'season-id' }),
      },
      {
        method: 'update',
        args: ['season-id', updateSeasonDto],
        expectedResult: createMockSeason({
          id: 'season-id',
          name: updateSeasonDto.name,
        }),
      },
      {
        method: 'remove',
        args: ['season-id'],
        expectedResult: createMockSeason({ id: 'season-id' }),
      },
    ])(
      'should delegate $method to service',
      async ({ method, args, expectedResult }) => {
        const serviceMethod = mockSeasonService[method];
        const controllerMethod = controller[method].bind(controller);

        await testControllerDelegation(
          controllerMethod,
          serviceMethod,
          args,
          expectedResult,
        );
      },
    );
  });

  // Test edge cases and variations
  describe('edge cases', () => {
    it('should handle empty pagination results', async () => {
      const emptyResult = createMockPaginatedResponse([], 0);

      await testControllerDelegation(
        controller.findAll.bind(controller),
        mockSeasonService.findAll,
        [basePaginationDto],
        emptyResult,
      );
    });

    it('should handle multiple seasons for a property', async () => {
      const propertyId = 'property-1';
      const expectedResult = [
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

      await testControllerDelegation(
        controller.findByProperty.bind(controller),
        mockSeasonService.findByProperty,
        [propertyId],
        expectedResult,
      );
    });

    it('should handle season with crops', async () => {
      const seasonWithCrops = createMockSeason({
        id: 'season-with-crops',
        crops: [
          createMockCrop({ id: 'crop-1', cultureType: { name: 'Soja' } }),
          createMockCrop({ id: 'crop-2', cultureType: { name: 'Milho' } }),
        ],
      });

      await testControllerDelegation(
        controller.findOne.bind(controller),
        mockSeasonService.findOne,
        ['season-with-crops'],
        seasonWithCrops,
      );
    });

    it('should handle different property configurations', async () => {
      const customProperty = createMockProperty(
        'custom-property',
        'Custom Farm',
      );
      const seasonWithCustomProperty = createMockSeason({
        propertyId: 'custom-property',
        property: customProperty,
      });

      await testControllerDelegation(
        controller.findOne.bind(controller),
        mockSeasonService.findOne,
        ['season-id'],
        seasonWithCustomProperty,
      );
    });

    it('should handle pagination with filters', async () => {
      const paginationWithFilters: PaginationDto = {
        ...basePaginationDto,
        filters: { name: 'Safra', year: 2024 },
      };

      const filteredResult = createMockPaginatedResponse([
        createMockSeason({ name: 'Safra 2024', year: 2024 }),
      ]);

      await testControllerDelegation(
        controller.findAll.bind(controller),
        mockSeasonService.findAll,
        [paginationWithFilters],
        filteredResult,
      );
    });
  });

  // Performance and boundary tests
  describe('boundary cases', () => {
    it('should handle large pagination requests', async () => {
      const largePagination: PaginationDto = {
        ...basePaginationDto,
        registersPerPage: 100,
        currentPage: 10,
      };

      const largeResult = createMockPaginatedResponse(
        Array.from({ length: 100 }, (_, i) =>
          createMockSeason({ id: `season-${i}`, name: `Safra ${2024 - i}` }),
        ),
        1000,
      );

      await testControllerDelegation(
        controller.findAll.bind(controller),
        mockSeasonService.findAll,
        [largePagination],
        largeResult,
      );
    });

    it('should handle complex update scenarios', async () => {
      const complexUpdate: UpdateSeasonDto = {
        name: 'Updated Season Name',
        year: 2025,
      };

      const updatedSeason = createMockSeason({
        id: 'complex-season',
        name: complexUpdate.name,
        year: complexUpdate.year,
      });

      await testControllerDelegation(
        controller.update.bind(controller),
        mockSeasonService.update,
        ['complex-season', complexUpdate],
        updatedSeason,
      );
    });
  });
});
