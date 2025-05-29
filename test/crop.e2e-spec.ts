import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { DocumentType } from '@prisma/client';
import { ZodExceptionFilter } from 'src/common/filters/zod-exception.filter';
import { cpf } from 'cpf-cnpj-validator';
import { filterToString } from 'src/common/utils/filterToString';

describe('CropController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let createdCropId: string;
  let testProducerId: string;
  let testPropertyId: string;
  let testSeasonId: string;
  let testSeasonId2: string;
  let testCultureTypeId: string;
  let testCultureTypeId2: string;

  // Centralized mock data
  const MOCKS = {
    crops: {
      plantedAreas: {
        small: 50.25,
        medium: 100.75,
        large: 200.5,
        updated: 150.0,
        invalid: {
          negative: -10,
          zero: 0,
        },
      },
    },
    producer: {
      document: cpf.generate(),
      name: 'Test Producer for Crops',
    },
    property: {
      name: 'Crop Farm',
      city: 'São Paulo',
      state: 'SP',
      totalArea: 500.0,
      arableArea: 400.0,
      vegetationArea: 100.0,
    },
    seasons: {
      season1: {
        name: 'Safra 2024 Crops',
        year: 2024,
      },
      season2: {
        name: 'Safra 2025 Crops',
        year: 2025,
      },
    },
    cultureTypes: {
      soja: {
        title: 'Soja',
        name: 'soja',
      },
      milho: {
        title: 'Milho',
        name: 'milho',
      },
    },
    ids: {
      nonExistent: 'cmb8j9e2j0022rssssw1kuj76',
      invalid: 'invalid-id-format',
    },
  };

  // Helper functions for creating crop data
  const createCropData = (
    overrides: Partial<{
      seasonId: string;
      cultureTypeId: string;
      plantedArea: number;
    }> = {},
  ) => ({
    seasonId: testSeasonId,
    cultureTypeId: testCultureTypeId,
    plantedArea: MOCKS.crops.plantedAreas.medium,
    ...overrides,
  });

  const createCropInDb = async (
    overrides: Partial<{
      seasonId: string;
      cultureTypeId: string;
      plantedArea: number;
    }> = {},
  ) => {
    return await prisma.crop.create({
      data: createCropData(overrides),
    });
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ZodExceptionFilter());

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Clean up test data
    await prisma.crop.deleteMany({
      where: {
        OR: [
          { season: { name: { contains: 'Crops' } } },
          {
            plantedArea: {
              in: Object.values(MOCKS.crops.plantedAreas).filter(
                (v) => typeof v === 'number',
              ),
            },
          },
        ],
      },
    });

    await prisma.season.deleteMany({
      where: { name: { contains: 'Crops' } },
    });

    await prisma.cultureType.deleteMany({
      where: { name: { in: ['soja', 'milho'] } },
    });

    await prisma.property.deleteMany({
      where: { name: MOCKS.property.name },
    });

    await prisma.producer.deleteMany({
      where: { document: MOCKS.producer.document },
    });

    // Create test producer
    const producer = await prisma.producer.create({
      data: {
        document: MOCKS.producer.document,
        documentType: DocumentType.CPF,
        name: MOCKS.producer.name,
      },
    });
    testProducerId = producer.id;

    // Create test property
    const property = await prisma.property.create({
      data: {
        ...MOCKS.property,
        producerId: testProducerId,
      },
    });
    testPropertyId = property.id;

    // Create test seasons
    const season1 = await prisma.season.create({
      data: {
        ...MOCKS.seasons.season1,
        propertyId: testPropertyId,
      },
    });
    testSeasonId = season1.id;

    const season2 = await prisma.season.create({
      data: {
        ...MOCKS.seasons.season2,
        propertyId: testPropertyId,
      },
    });
    testSeasonId2 = season2.id;

    // Create test culture types
    const cultureType1 = await prisma.cultureType.create({
      data: MOCKS.cultureTypes.soja,
    });
    testCultureTypeId = cultureType1.id;

    const cultureType2 = await prisma.cultureType.create({
      data: MOCKS.cultureTypes.milho,
    });
    testCultureTypeId2 = cultureType2.id;
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.crop.deleteMany({
      where: {
        OR: [
          { season: { name: { contains: 'Crops' } } },
          {
            plantedArea: {
              in: Object.values(MOCKS.crops.plantedAreas).filter(
                (v) => typeof v === 'number',
              ),
            },
          },
        ],
      },
    });
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.season.deleteMany({
      where: { name: { contains: 'Crops' } },
    });

    await prisma.cultureType.deleteMany({
      where: { name: { in: ['soja', 'milho'] } },
    });

    await prisma.property.deleteMany({
      where: { name: MOCKS.property.name },
    });

    await prisma.producer.deleteMany({
      where: { document: MOCKS.producer.document },
    });

    await app.close();
  });

  describe('POST /crops', () => {
    it('should create a new crop', () => {
      return request(app.getHttpServer())
        .post('/crops')
        .send(createCropData({ plantedArea: MOCKS.crops.plantedAreas.small }))
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.seasonId).toBe(testSeasonId);
          expect(res.body.cultureTypeId).toBe(testCultureTypeId);
          expect(Number(res.body.plantedArea)).toBe(
            MOCKS.crops.plantedAreas.small,
          );
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
          createdCropId = res.body.id;
        });
    });

    it('should create a crop without planted area', () => {
      return request(app.getHttpServer())
        .post('/crops')
        .send({
          seasonId: testSeasonId,
          cultureTypeId: testCultureTypeId2,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.seasonId).toBe(testSeasonId);
          expect(res.body.cultureTypeId).toBe(testCultureTypeId2);
          expect(res.body.plantedArea).toBeNull();
        });
    });

    it('should return 400 for duplicate season-culture combination', async () => {
      // First, create a crop
      await request(app.getHttpServer())
        .post('/crops')
        .send(createCropData())
        .expect(201);

      // Try to create another with the same season and culture type
      return request(app.getHttpServer())
        .post('/crops')
        .send(createCropData())
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'A crop with this season and culture type combination already exists',
          );
        });
    });

    it('should return 400 for non-existent season', () => {
      return request(app.getHttpServer())
        .post('/crops')
        .send(createCropData({ seasonId: MOCKS.ids.nonExistent }))
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Season not found');
        });
    });

    it('should return 400 for non-existent culture type', () => {
      return request(app.getHttpServer())
        .post('/crops')
        .send(createCropData({ cultureTypeId: MOCKS.ids.nonExistent }))
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Culture type not found');
        });
    });

    it('should return 400 for negative planted area', () => {
      return request(app.getHttpServer())
        .post('/crops')
        .send(
          createCropData({
            plantedArea: MOCKS.crops.plantedAreas.invalid.negative,
          }),
        )
        .expect(400);
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/crops')
        .send({
          seasonId: testSeasonId,
        })
        .expect(400);
    });

    it('should return 400 for invalid seasonId format', () => {
      return request(app.getHttpServer())
        .post('/crops')
        .send(createCropData({ seasonId: MOCKS.ids.invalid }))
        .expect(400);
    });

    it('should return 400 for invalid cultureTypeId format', () => {
      return request(app.getHttpServer())
        .post('/crops')
        .send(createCropData({ cultureTypeId: MOCKS.ids.invalid }))
        .expect(400);
    });
  });

  describe('GET /crops', () => {
    beforeEach(async () => {
      // Create test crops
      await createCropInDb({
        seasonId: testSeasonId,
        cultureTypeId: testCultureTypeId,
        plantedArea: MOCKS.crops.plantedAreas.small,
      });

      await createCropInDb({
        seasonId: testSeasonId2,
        cultureTypeId: testCultureTypeId2,
        plantedArea: MOCKS.crops.plantedAreas.large,
      });
    });

    it('should return paginated list of crops', () => {
      return request(app.getHttpServer())
        .get('/crops')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('totalCountOfRegisters');
          expect(res.body).toHaveProperty('currentPage');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThanOrEqual(2);

          // Check that each crop has the expected structure
          res.body.data.forEach((crop: any) => {
            expect(crop).toHaveProperty('id');
            expect(crop).toHaveProperty('seasonId');
            expect(crop).toHaveProperty('cultureTypeId');
          });
        });
    });

    it('should return paginated list with custom pagination', () => {
      return request(app.getHttpServer())
        .get('/crops?currentPage=1&registersPerPage=1')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBe(1);
          expect(res.body.currentPage).toBe(1);
        });
    });

    it('should support filtering by seasonId', () => {
      return request(app.getHttpServer())
        .get(`/crops?${filterToString({ seasonId: testSeasonId })}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
          res.body.data.forEach((crop: any) => {
            expect(crop.seasonId).toBe(testSeasonId);
          });
        });
    });

    it('should support filtering by cultureTypeId', () => {
      return request(app.getHttpServer())
        .get(`/crops?${filterToString({ cultureTypeId: testCultureTypeId })}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
          res.body.data.forEach((crop: any) => {
            expect(crop.cultureTypeId).toBe(testCultureTypeId);
          });
        });
    });

    it('should support filtering by planted area (gte)', () => {
      return request(app.getHttpServer())
        .get(
          `/crops?${filterToString({ plantedArea: MOCKS.crops.plantedAreas.medium })}`,
        )
        .expect(200)
        .expect((res) => {
          res.body.data.forEach((crop: any) => {
            if (crop.plantedArea) {
              expect(Number(crop.plantedArea)).toBeGreaterThanOrEqual(
                MOCKS.crops.plantedAreas.medium,
              );
            }
          });
        });
    });
  });

  describe('GET /crops/by-season/:seasonId', () => {
    beforeEach(async () => {
      // Create test crops for the season
      await createCropInDb({
        seasonId: testSeasonId,
        cultureTypeId: testCultureTypeId,
        plantedArea: MOCKS.crops.plantedAreas.small,
      });
      await createCropInDb({
        seasonId: testSeasonId,
        cultureTypeId: testCultureTypeId2,
        plantedArea: MOCKS.crops.plantedAreas.medium,
      });
    });

    it('should return crops for a specific season', () => {
      return request(app.getHttpServer())
        .get(`/crops/by-season/${testSeasonId}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);

          res.body.forEach((crop: any) => {
            expect(crop.seasonId).toBe(testSeasonId);
            expect(crop).toHaveProperty('season');
            expect(crop).toHaveProperty('cultureType');
          });
        });
    });

    it('should return empty array for season with no crops', () => {
      return request(app.getHttpServer())
        .get(`/crops/by-season/${testSeasonId2}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });
  });

  describe('GET /crops/by-culture-type/:cultureTypeId', () => {
    beforeEach(async () => {
      // Create test crops for the culture type
      await createCropInDb({
        seasonId: testSeasonId,
        cultureTypeId: testCultureTypeId,
        plantedArea: MOCKS.crops.plantedAreas.small,
      });
      await createCropInDb({
        seasonId: testSeasonId2,
        cultureTypeId: testCultureTypeId,
        plantedArea: MOCKS.crops.plantedAreas.medium,
      });
    });

    it('should return crops for a specific culture type', () => {
      return request(app.getHttpServer())
        .get(`/crops/by-culture-type/${testCultureTypeId}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);

          res.body.forEach((crop: any) => {
            expect(crop.cultureTypeId).toBe(testCultureTypeId);
            expect(crop).toHaveProperty('season');
            expect(crop).toHaveProperty('cultureType');
          });
        });
    });

    it('should return empty array for culture type with no crops', () => {
      return request(app.getHttpServer())
        .get(`/crops/by-culture-type/${testCultureTypeId2}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });
  });

  describe('GET /crops/:id', () => {
    beforeEach(async () => {
      const crop = await createCropInDb({
        plantedArea: MOCKS.crops.plantedAreas.medium,
      });
      createdCropId = crop.id;
    });

    it('should return crop by id', () => {
      return request(app.getHttpServer())
        .get(`/crops/${createdCropId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdCropId);
          expect(res.body.seasonId).toBe(testSeasonId);
          expect(res.body.cultureTypeId).toBe(testCultureTypeId);
          expect(Number(res.body.plantedArea)).toBe(
            MOCKS.crops.plantedAreas.medium,
          );
          expect(res.body).toHaveProperty('season');
          expect(res.body).toHaveProperty('cultureType');
        });
    });

    it('should return 404 for non-existent crop', () => {
      return request(app.getHttpServer())
        .get('/crops/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /crops/:id', () => {
    beforeEach(async () => {
      const crop = await createCropInDb({
        plantedArea: MOCKS.crops.plantedAreas.medium,
      });
      createdCropId = crop.id;
    });

    it('should update crop planted area', () => {
      return request(app.getHttpServer())
        .put(`/crops/${createdCropId}`)
        .send({
          plantedArea: MOCKS.crops.plantedAreas.updated,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdCropId);
          expect(Number(res.body.plantedArea)).toBe(
            MOCKS.crops.plantedAreas.updated,
          );
          expect(res.body.seasonId).toBe(testSeasonId);
          expect(res.body.cultureTypeId).toBe(testCultureTypeId);
        });
    });

    it('should update crop season and culture type', () => {
      return request(app.getHttpServer())
        .put(`/crops/${createdCropId}`)
        .send({
          seasonId: testSeasonId2,
          cultureTypeId: testCultureTypeId2,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.seasonId).toBe(testSeasonId2);
          expect(res.body.cultureTypeId).toBe(testCultureTypeId2);
        });
    });

    it('should update multiple fields', () => {
      return request(app.getHttpServer())
        .put(`/crops/${createdCropId}`)
        .send({
          seasonId: testSeasonId2,
          cultureTypeId: testCultureTypeId2,
          plantedArea: MOCKS.crops.plantedAreas.large,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.seasonId).toBe(testSeasonId2);
          expect(res.body.cultureTypeId).toBe(testCultureTypeId2);
          expect(Number(res.body.plantedArea)).toBe(
            MOCKS.crops.plantedAreas.large,
          );
        });
    });

    it('should return 404 for non-existent crop', () => {
      return request(app.getHttpServer())
        .put('/crops/non-existent-id')
        .send({
          plantedArea: MOCKS.crops.plantedAreas.updated,
        })
        .expect(404);
    });

    it('should return 400 for negative planted area', () => {
      return request(app.getHttpServer())
        .put(`/crops/${createdCropId}`)
        .send({
          plantedArea: MOCKS.crops.plantedAreas.invalid.negative,
        })
        .expect(400);
    });

    it('should return 400 for non-existent season', () => {
      return request(app.getHttpServer())
        .put(`/crops/${createdCropId}`)
        .send({
          seasonId: MOCKS.ids.nonExistent,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Season not found');
        });
    });

    it('should return 400 for non-existent culture type', () => {
      return request(app.getHttpServer())
        .put(`/crops/${createdCropId}`)
        .send({
          cultureTypeId: MOCKS.ids.nonExistent,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Culture type not found');
        });
    });

    it('should return 400 for duplicate season-culture combination when updating', async () => {
      // Create another crop
      await createCropInDb({
        seasonId: testSeasonId2,
        cultureTypeId: testCultureTypeId2,
      });

      // Try to update current crop to have the same season and culture type
      return request(app.getHttpServer())
        .put(`/crops/${createdCropId}`)
        .send({
          seasonId: testSeasonId2,
          cultureTypeId: testCultureTypeId2,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'A crop with this season and culture type combination already exists',
          );
        });
    });
  });

  describe('DELETE /crops/:id', () => {
    beforeEach(async () => {
      const crop = await createCropInDb({
        plantedArea: MOCKS.crops.plantedAreas.medium,
      });
      createdCropId = crop.id;
    });

    it('should delete crop', () => {
      return request(app.getHttpServer())
        .delete(`/crops/${createdCropId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdCropId);
          expect(res.body.seasonId).toBe(testSeasonId);
          expect(res.body.cultureTypeId).toBe(testCultureTypeId);
        });
    });

    it('should return 404 for non-existent crop', () => {
      return request(app.getHttpServer())
        .delete('/crops/non-existent-id')
        .expect(404);
    });

    it('should verify crop is deleted', async () => {
      await request(app.getHttpServer())
        .delete(`/crops/${createdCropId}`)
        .expect(200);

      return request(app.getHttpServer())
        .get(`/crops/${createdCropId}`)
        .expect(404);
    });
  });
});
