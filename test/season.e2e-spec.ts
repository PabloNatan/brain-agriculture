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
  const seasonMockYear = 1999;
  const safraMock = 'Safra 1999';
  const safraMock1 = 'Safra 1998';
  const farmMock = 'Season Farm';
  const seasonProducerCpf = cpf.generate();

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ZodExceptionFilter());

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Clean up test data
    await prisma.season.deleteMany({
      where: {
        OR: [
          { name: safraMock },
          { name: safraMock1 },
          { name: 'Test Season' },
          { name: 'Updated Season' },
          { name: 'Season to Delete' },
        ],
      },
    });

    await prisma.property.deleteMany({
      where: {
        name: farmMock,
      },
    });

    await prisma.producer.deleteMany({
      where: {
        document: seasonProducerCpf,
      },
    });

    // Create test producer and property for seasons
    const producer = await prisma.producer.create({
      data: {
        document: seasonProducerCpf,
        documentType: DocumentType.CPF,
        name: 'Test Producer',
      },
    });
    testProducerId = producer.id;

    const property = await prisma.property.create({
      data: {
        name: farmMock,
        city: 'São Paulo',
        state: 'SP',
        totalArea: 100.0,
        arableArea: 80.0,
        vegetationArea: 20.0,
        producerId: testProducerId,
      },
    });
    testPropertyId = property.id;
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.season.deleteMany({
      where: {
        OR: [
          { name: safraMock },
          { name: safraMock1 },
          { name: 'Test Season' },
          { name: 'Updated Season' },
          { name: 'Season to Delete' },
        ],
      },
    });
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.property.deleteMany({
      where: {
        name: farmMock,
      },
    });

    await prisma.producer.deleteMany({
      where: {
        document: seasonProducerCpf,
      },
    });

    await app.close();
  });

  describe('POST /seasons', () => {
    it('should create a new season', () => {
      return request(app.getHttpServer())
        .post('/seasons')
        .send({
          name: safraMock,
          year: 2024,
          propertyId: testPropertyId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(safraMock);
          expect(res.body.year).toBe(2024);
          expect(res.body.propertyId).toBe(testPropertyId);
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
          createdSeasonId = res.body.id;
        });
    });

    it('should create another season with different year', () => {
      return request(app.getHttpServer())
        .post('/seasons')
        .send({
          name: safraMock1,
          year: 2025,
          propertyId: testPropertyId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(safraMock1);
          expect(res.body.year).toBe(2025);
          expect(res.body.propertyId).toBe(testPropertyId);
        });
    });

    it('should return 400 for duplicate season (same name and year for same property)', async () => {
      // First, create a season
      await request(app.getHttpServer())
        .post('/seasons')
        .send({
          name: 'Test Season',
          year: 2024,
          propertyId: testPropertyId,
        })
        .expect(201);

      // Try to create another with the same name and year for the same property
      return request(app.getHttpServer())
        .post('/seasons')
        .send({
          name: 'Test Season',
          year: 2024,
          propertyId: testPropertyId,
        })
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
        .send({
          name: safraMock,
          year: 2024,
          propertyId: 'cmb8j9e2j0022rssssw1kuj76',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Property not found');
        });
    });

    it('should return 400 for invalid year (too low)', () => {
      return request(app.getHttpServer())
        .post('/seasons')
        .send({
          name: 'Safra Ancient',
          year: 1800,
          propertyId: testPropertyId,
        })
        .expect(400);
    });

    it('should return 400 for invalid year (too high)', () => {
      return request(app.getHttpServer())
        .post('/seasons')
        .send({
          name: 'Safra Future',
          year: 2200,
          propertyId: testPropertyId,
        })
        .expect(400);
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/seasons')
        .send({
          name: 'Incomplete Season',
        })
        .expect(400);
    });

    it('should return 400 for empty name', () => {
      return request(app.getHttpServer())
        .post('/seasons')
        .send({
          name: '',
          year: 2024,
          propertyId: testPropertyId,
        })
        .expect(400);
    });

    it('should return 400 for invalid propertyId format', () => {
      return request(app.getHttpServer())
        .post('/seasons')
        .send({
          name: safraMock,
          year: 2024,
          propertyId: 'invalid-id-format',
        })
        .expect(400);
    });
  });

  describe('GET /seasons', () => {
    beforeEach(async () => {
      // Create test seasons
      await prisma.season.create({
        data: {
          name: safraMock,
          year: seasonMockYear,
          propertyId: testPropertyId,
        },
      });

      await prisma.season.create({
        data: {
          name: safraMock1,
          year: 2025,
          propertyId: testPropertyId,
        },
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
        .get(`/seasons?${filterToString({ name: String(seasonMockYear) })}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
          expect(res.body.data[0].name).toContain(String(seasonMockYear));
        });
    });

    it('should support filtering by year', () => {
      return request(app.getHttpServer())
        .get(`/seasons?${filterToString({ year: seasonMockYear })}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
          expect(res.body.data[0].year).toBe(seasonMockYear);
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
      // Create test seasons for the property
      await prisma.season.create({
        data: {
          name: safraMock,
          year: 2024,
          propertyId: testPropertyId,
        },
      });

      await prisma.season.create({
        data: {
          name: 'Safra 2023',
          year: 2023,
          propertyId: testPropertyId,
        },
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

          // Should be ordered by year desc (2024 first, then 2023)
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
      const season = await prisma.season.create({
        data: {
          name: 'Test Season',
          year: 2024,
          propertyId: testPropertyId,
        },
      });
      createdSeasonId = season.id;
    });

    it('should return season by id', () => {
      return request(app.getHttpServer())
        .get(`/seasons/${createdSeasonId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdSeasonId);
          expect(res.body.name).toBe('Test Season');
          expect(res.body.year).toBe(2024);
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
      const season = await prisma.season.create({
        data: {
          name: 'Test Season',
          year: 2024,
          propertyId: testPropertyId,
        },
      });
      createdSeasonId = season.id;
    });

    it('should update season name', () => {
      return request(app.getHttpServer())
        .put(`/seasons/${createdSeasonId}`)
        .send({
          name: 'Updated Season',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdSeasonId);
          expect(res.body.name).toBe('Updated Season');
          expect(res.body.year).toBe(2024);
          expect(res.body.propertyId).toBe(testPropertyId);
        });
    });

    it('should update season year', () => {
      return request(app.getHttpServer())
        .put(`/seasons/${createdSeasonId}`)
        .send({
          year: 2025,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.year).toBe(2025);
          expect(res.body.name).toBe('Test Season');
        });
    });

    it('should update multiple fields', () => {
      return request(app.getHttpServer())
        .put(`/seasons/${createdSeasonId}`)
        .send({
          name: 'Completely Updated Season',
          year: 2026,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Completely Updated Season');
          expect(res.body.year).toBe(2026);
        });
    });

    it('should return 404 for non-existent season', () => {
      return request(app.getHttpServer())
        .put('/seasons/non-existent-id')
        .send({
          name: 'Updated Name',
        })
        .expect(404);
    });

    it('should return 400 for invalid year (too low)', () => {
      return request(app.getHttpServer())
        .put(`/seasons/${createdSeasonId}`)
        .send({
          year: 1800,
        })
        .expect(400);
    });

    it('should return 400 for invalid year (too high)', () => {
      return request(app.getHttpServer())
        .put(`/seasons/${createdSeasonId}`)
        .send({
          year: 2200,
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
      // Create another season
      await prisma.season.create({
        data: {
          name: 'Existing Season',
          year: 2025,
          propertyId: testPropertyId,
        },
      });

      // Try to update current season to have the same name and year
      return request(app.getHttpServer())
        .put(`/seasons/${createdSeasonId}`)
        .send({
          name: 'Existing Season',
          year: 2025,
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
      const season = await prisma.season.create({
        data: {
          name: 'Season to Delete',
          year: 2024,
          propertyId: testPropertyId,
        },
      });
      createdSeasonId = season.id;
    });

    it('should delete season', () => {
      return request(app.getHttpServer())
        .delete(`/seasons/${createdSeasonId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdSeasonId);
          expect(res.body.name).toBe('Season to Delete');
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
