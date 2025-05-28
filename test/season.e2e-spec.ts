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

describe('SeasonController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let createdSeasonId: string;
  let testProducerId: string;
  let testPropertyId: string;

  // Centralized mock data
  const MOCKS = {
    seasons: {
      names: {
        safra1999: 'Safra 1999',
        safra1998: 'Safra 1998',
        test: 'Test Season',
        updated: 'Updated Season',
        toDelete: 'Season to Delete',
        existing: 'Existing Season',
        incomplete: 'Incomplete Season',
        ancient: 'Safra Ancient',
        future: 'Safra Future',
        safra2023: 'Safra 2023',
        completelyUpdated: 'Completely Updated Season',
      },
      years: {
        mock: 1999,
        current: 2024,
        next: 2025,
        previous: 2023,
        future: 2026,
        invalid: {
          tooLow: 1800,
          tooHigh: 2200,
        },
      },
    },
    producer: {
      document: cpf.generate(),
      name: 'Test Producer',
    },
    property: {
      name: 'Season Farm',
      city: 'São Paulo',
      state: 'SP',
      totalArea: 100.0,
      arableArea: 80.0,
      vegetationArea: 20.0,
    },
    ids: {
      nonExistent: 'cmb8j9e2j0022rssssw1kuj76',
      invalid: 'invalid-id-format',
    },
  };

  // Helper functions for creating season data
  const createSeasonData = (
    overrides: Partial<{
      name: string;
      year: number;
      propertyId: string;
    }> = {},
  ) => ({
    name: MOCKS.seasons.names.safra1999,
    year: MOCKS.seasons.years.current,
    propertyId: testPropertyId,
    ...overrides,
  });

  const createSeasonInDb = async (
    overrides: Partial<{
      name: string;
      year: number;
      propertyId: string;
    }> = {},
  ) => {
    return await prisma.season.create({
      data: createSeasonData(overrides),
    });
  };

  // Get all season names for cleanup
  const getAllSeasonNames = () => Object.values(MOCKS.seasons.names);

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ZodExceptionFilter());

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Clean up test data using centralized season names
    await prisma.season.deleteMany({
      where: {
        OR: getAllSeasonNames().map((name) => ({ name })),
      },
    });

    await prisma.property.deleteMany({
      where: { name: MOCKS.property.name },
    });

    await prisma.producer.deleteMany({
      where: { document: MOCKS.producer.document },
    });

    // Create test producer and property for seasons
    const producer = await prisma.producer.create({
      data: {
        document: MOCKS.producer.document,
        documentType: DocumentType.CPF,
        name: MOCKS.producer.name,
      },
    });
    testProducerId = producer.id;

    const property = await prisma.property.create({
      data: {
        ...MOCKS.property,
        producerId: testProducerId,
      },
    });
    testPropertyId = property.id;
  });

  afterEach(async () => {
    // Clean up test data after each test using centralized season names
    await prisma.season.deleteMany({
      where: {
        OR: getAllSeasonNames().map((name) => ({ name })),
      },
    });
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.property.deleteMany({
      where: { name: MOCKS.property.name },
    });

    await prisma.producer.deleteMany({
      where: { document: MOCKS.producer.document },
    });

    await app.close();
  });

  describe('POST /seasons', () => {
    it('should create a new season', () => {
      return request(app.getHttpServer())
        .post('/seasons')
        .send(createSeasonData({ name: MOCKS.seasons.names.safra1999 }))
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(MOCKS.seasons.names.safra1999);
          expect(res.body.year).toBe(MOCKS.seasons.years.current);
          expect(res.body.propertyId).toBe(testPropertyId);
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
          createdSeasonId = res.body.id;
        });
    });

    it('should create another season with different year', () => {
      return request(app.getHttpServer())
        .post('/seasons')
        .send(
          createSeasonData({
            name: MOCKS.seasons.names.safra1998,
            year: MOCKS.seasons.years.next,
          }),
        )
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(MOCKS.seasons.names.safra1998);
          expect(res.body.year).toBe(MOCKS.seasons.years.next);
          expect(res.body.propertyId).toBe(testPropertyId);
        });
    });

    it('should return 400 for duplicate season (same name and year for same property)', async () => {
      // First, create a season
      await request(app.getHttpServer())
        .post('/seasons')
        .send(createSeasonData({ name: MOCKS.seasons.names.test }))
        .expect(201);

      // Try to create another with the same name and year for the same property
      return request(app.getHttpServer())
        .post('/seasons')
        .send(createSeasonData({ name: MOCKS.seasons.names.test }))
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'Season with this name and year already exists',
          );
        });
    });

    it('should return 400 for non-existent property', () => {
      return request(app.getHttpServer())
        .post('/seasons')
        .send(
          createSeasonData({
            name: MOCKS.seasons.names.safra1999,
            propertyId: MOCKS.ids.nonExistent,
          }),
        )
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Property not found');
        });
    });

    it('should return 400 for invalid year (too low)', () => {
      return request(app.getHttpServer())
        .post('/seasons')
        .send(
          createSeasonData({
            name: MOCKS.seasons.names.ancient,
            year: MOCKS.seasons.years.invalid.tooLow,
          }),
        )
        .expect(400);
    });

    it('should return 400 for invalid year (too high)', () => {
      return request(app.getHttpServer())
        .post('/seasons')
        .send(
          createSeasonData({
            name: MOCKS.seasons.names.future,
            year: MOCKS.seasons.years.invalid.tooHigh,
          }),
        )
        .expect(400);
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/seasons')
        .send({
          name: MOCKS.seasons.names.incomplete,
        })
        .expect(400);
    });

    it('should return 400 for empty name', () => {
      return request(app.getHttpServer())
        .post('/seasons')
        .send(createSeasonData({ name: '' }))
        .expect(400);
    });

    it('should return 400 for invalid propertyId format', () => {
      return request(app.getHttpServer())
        .post('/seasons')
        .send(
          createSeasonData({
            propertyId: MOCKS.ids.invalid,
          }),
        )
        .expect(400);
    });
  });

  describe('GET /seasons', () => {
    beforeEach(async () => {
      // Create test seasons using helper function
      await createSeasonInDb({
        name: MOCKS.seasons.names.safra1999,
        year: MOCKS.seasons.years.mock,
      });

      await createSeasonInDb({
        name: MOCKS.seasons.names.safra1998,
        year: MOCKS.seasons.years.next,
      });
    });

    it('should return paginated list of seasons', () => {
      return request(app.getHttpServer())
        .get('/seasons')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('totalCountOfRegisters');
          expect(res.body).toHaveProperty('currentPage');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThanOrEqual(2);

          // Check that each season has the expected structure
          res.body.data.forEach((season: any) => {
            expect(season).toHaveProperty('id');
            expect(season).toHaveProperty('name');
            expect(season).toHaveProperty('year');
            expect(season).toHaveProperty('propertyId');
          });
        });
    });

    it('should return paginated list with custom pagination', () => {
      return request(app.getHttpServer())
        .get('/seasons?currentPage=1&registersPerPage=1')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBe(1);
          expect(res.body.currentPage).toBe(1);
        });
    });

    it('should support filtering by name', () => {
      return request(app.getHttpServer())
        .get(
          `/seasons?${filterToString({ name: String(MOCKS.seasons.years.mock) })}`,
        )
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
          expect(res.body.data[0].name).toContain(
            String(MOCKS.seasons.years.mock),
          );
        });
    });

    it('should support filtering by year', () => {
      return request(app.getHttpServer())
        .get(`/seasons?${filterToString({ year: MOCKS.seasons.years.mock })}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
          expect(res.body.data[0].year).toBe(MOCKS.seasons.years.mock);
        });
    });

    it('should support filtering by propertyId', () => {
      return request(app.getHttpServer())
        .get(`/seasons?${filterToString({ propertyId: testPropertyId })}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThanOrEqual(2);
          res.body.data.forEach((season: any) => {
            expect(season.propertyId).toBe(testPropertyId);
          });
        });
    });
  });

  describe('GET /seasons/property/:propertyId', () => {
    beforeEach(async () => {
      // Create test seasons for the property using helper function
      await createSeasonInDb({ name: MOCKS.seasons.names.safra1999 });
      await createSeasonInDb({
        name: MOCKS.seasons.names.safra2023,
        year: MOCKS.seasons.years.previous,
      });
    });

    it('should return seasons for a specific property', () => {
      return request(app.getHttpServer())
        .get(`/seasons/property/${testPropertyId}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);

          res.body.forEach((season: any) => {
            expect(season.propertyId).toBe(testPropertyId);
            expect(season).toHaveProperty('property');
            expect(season).toHaveProperty('crops');
          });

          // Should be ordered by year desc
          expect(res.body[0].year).toBeGreaterThanOrEqual(res.body[1].year);
        });
    });

    it('should return 400 for non-existent property', () => {
      return request(app.getHttpServer())
        .get('/seasons/property/non-existent-property-id')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Property not found');
        });
    });
  });

  describe('GET /seasons/:id', () => {
    beforeEach(async () => {
      const season = await createSeasonInDb({ name: MOCKS.seasons.names.test });
      createdSeasonId = season.id;
    });

    it('should return season by id', () => {
      return request(app.getHttpServer())
        .get(`/seasons/${createdSeasonId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdSeasonId);
          expect(res.body.name).toBe(MOCKS.seasons.names.test);
          expect(res.body.year).toBe(MOCKS.seasons.years.current);
          expect(res.body.propertyId).toBe(testPropertyId);
          expect(res.body).toHaveProperty('property');
          expect(res.body).toHaveProperty('crops');
        });
    });

    it('should return 404 for non-existent season', () => {
      return request(app.getHttpServer())
        .get('/seasons/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /seasons/:id', () => {
    beforeEach(async () => {
      const season = await createSeasonInDb({ name: MOCKS.seasons.names.test });
      createdSeasonId = season.id;
    });

    it('should update season name', () => {
      return request(app.getHttpServer())
        .put(`/seasons/${createdSeasonId}`)
        .send({
          name: MOCKS.seasons.names.updated,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdSeasonId);
          expect(res.body.name).toBe(MOCKS.seasons.names.updated);
          expect(res.body.year).toBe(MOCKS.seasons.years.current);
          expect(res.body.propertyId).toBe(testPropertyId);
        });
    });

    it('should update season year', () => {
      return request(app.getHttpServer())
        .put(`/seasons/${createdSeasonId}`)
        .send({
          year: MOCKS.seasons.years.next,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.year).toBe(MOCKS.seasons.years.next);
          expect(res.body.name).toBe(MOCKS.seasons.names.test);
        });
    });

    it('should update multiple fields', () => {
      return request(app.getHttpServer())
        .put(`/seasons/${createdSeasonId}`)
        .send({
          name: MOCKS.seasons.names.completelyUpdated,
          year: MOCKS.seasons.years.future,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe(MOCKS.seasons.names.completelyUpdated);
          expect(res.body.year).toBe(MOCKS.seasons.years.future);
        });
    });

    it('should return 404 for non-existent season', () => {
      return request(app.getHttpServer())
        .put('/seasons/non-existent-id')
        .send({
          name: MOCKS.seasons.names.updated,
        })
        .expect(404);
    });

    it('should return 400 for invalid year (too low)', () => {
      return request(app.getHttpServer())
        .put(`/seasons/${createdSeasonId}`)
        .send({
          year: MOCKS.seasons.years.invalid.tooLow,
        })
        .expect(400);
    });

    it('should return 400 for invalid year (too high)', () => {
      return request(app.getHttpServer())
        .put(`/seasons/${createdSeasonId}`)
        .send({
          year: MOCKS.seasons.years.invalid.tooHigh,
        })
        .expect(400);
    });

    it('should return 400 for empty name', () => {
      return request(app.getHttpServer())
        .put(`/seasons/${createdSeasonId}`)
        .send({
          name: '',
        })
        .expect(400);
    });

    it('should return 400 for duplicate season when updating', async () => {
      // Create another season using helper function
      await createSeasonInDb({
        name: MOCKS.seasons.names.existing,
        year: MOCKS.seasons.years.next,
      });

      // Try to update current season to have the same name and year
      return request(app.getHttpServer())
        .put(`/seasons/${createdSeasonId}`)
        .send({
          name: MOCKS.seasons.names.existing,
          year: MOCKS.seasons.years.next,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'Season with this name and year already exists',
          );
        });
    });
  });

  describe('DELETE /seasons/:id', () => {
    beforeEach(async () => {
      const season = await createSeasonInDb({
        name: MOCKS.seasons.names.toDelete,
      });
      createdSeasonId = season.id;
    });

    it('should delete season', () => {
      return request(app.getHttpServer())
        .delete(`/seasons/${createdSeasonId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdSeasonId);
          expect(res.body.name).toBe(MOCKS.seasons.names.toDelete);
        });
    });

    it('should return 404 for non-existent season', () => {
      return request(app.getHttpServer())
        .delete('/seasons/non-existent-id')
        .expect(404);
    });

    it('should verify season is deleted', async () => {
      await request(app.getHttpServer())
        .delete(`/seasons/${createdSeasonId}`)
        .expect(200);

      return request(app.getHttpServer())
        .get(`/seasons/${createdSeasonId}`)
        .expect(404);
    });
  });
});
