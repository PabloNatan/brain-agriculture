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

describe('PropertyController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let createdPropertyId: string;
  let testProducerId: string;
  let testCultureTypeId: string;

  // Centralized mock data
  const MOCKS = {
    properties: {
      names: {
        fazendaSaoJoao: 'Fazenda São João',
        fazendaSantaRita: 'Fazenda Santa Rita',
        test: 'Test Property',
        updated: 'Updated Property',
        toDelete: 'Property to Delete',
        existing: 'Existing Property',
        incomplete: 'Incomplete Property',
        invalid: 'Invalid Property',
        completelyUpdated: 'Completely Updated Property',
      },
      cities: {
        ribeiraoPreto: 'Ribeirão Preto',
        saoCarlos: 'São Carlos',
        campinas: 'Campinas',
        invalid: 'Invalid City',
      },
      states: {
        sp: 'SP',
        mg: 'MG',
        invalid: 'INVALID',
      },
      areas: {
        total: 1000.0,
        arable: 800.0,
        vegetation: 200.0,
        large: {
          total: 2000.0,
          arable: 1600.0,
          vegetation: 400.0,
        },
        invalid: {
          totalNegative: -100.0,
          arableExceeding: 1200.0, // exceeds total
          vegetationExceeding: 300.0, // with arable = 800, total = 1100 > 1000
        },
      },
    },
    producer: {
      document: cpf.generate(),
      name: 'Test Producer',
    },
    cultureType: {
      name: 'soja',
      title: 'Soja',
    },
    ids: {
      nonExistent: 'cmb8j9e2j0022rssssw1kuj76',
      invalid: 'invalid-id-format',
    },
  };

  // Helper functions for creating property data
  const createPropertyData = (
    overrides: Partial<{
      name: string;
      city: string;
      state: string;
      totalArea: number;
      arableArea: number;
      vegetationArea: number;
      producerId: string;
    }> = {},
  ) => ({
    name: MOCKS.properties.names.fazendaSaoJoao,
    city: MOCKS.properties.cities.ribeiraoPreto,
    state: MOCKS.properties.states.sp,
    totalArea: MOCKS.properties.areas.total,
    arableArea: MOCKS.properties.areas.arable,
    vegetationArea: MOCKS.properties.areas.vegetation,
    producerId: testProducerId,
    ...overrides,
  });

  const createPropertyInDb = async (
    overrides: Partial<{
      name: string;
      city: string;
      state: string;
      totalArea: number;
      arableArea: number;
      vegetationArea: number;
      producerId: string;
    }> = {},
  ) => {
    return await prisma.property.create({
      data: createPropertyData(overrides),
    });
  };

  // Get all property names for cleanup
  const getAllPropertyNames = () => Object.values(MOCKS.properties.names);

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ZodExceptionFilter());

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Clean up test data using centralized property names
    await prisma.property.deleteMany({
      where: {
        OR: getAllPropertyNames().map((name) => ({ name })),
      },
    });

    await prisma.producer.deleteMany({
      where: { document: MOCKS.producer.document },
    });

    await prisma.cultureType.deleteMany({
      where: { name: MOCKS.cultureType.name },
    });

    // Create test producer for properties
    const producer = await prisma.producer.create({
      data: {
        document: MOCKS.producer.document,
        documentType: DocumentType.CPF,
        name: MOCKS.producer.name,
      },
    });
    testProducerId = producer.id;

    // Create test culture type
    const cultureType = await prisma.cultureType.create({
      data: MOCKS.cultureType,
    });
    testCultureTypeId = cultureType.id;
  });

  afterEach(async () => {
    // Clean up test data after each test using centralized property names
    await prisma.property.deleteMany({
      where: {
        OR: getAllPropertyNames().map((name) => ({ name })),
      },
    });
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.producer.deleteMany({
      where: { document: MOCKS.producer.document },
    });

    await prisma.cultureType.deleteMany({
      where: { name: MOCKS.cultureType.name },
    });

    await app.close();
  });

  describe('POST /properties', () => {
    it('should create a new property', () => {
      return request(app.getHttpServer())
        .post('/properties')
        .send(
          createPropertyData({
            name: MOCKS.properties.names.fazendaSaoJoao,
            ...MOCKS.properties.areas.large,
          }),
        )
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(MOCKS.properties.names.fazendaSaoJoao);
          expect(res.body.city).toBe(MOCKS.properties.cities.ribeiraoPreto);
          expect(res.body.state).toBe(MOCKS.properties.states.sp);
          expect(res.body.totalArea).toBe(String(MOCKS.properties.areas.total));
          expect(res.body.arableArea).toBe(
            String(MOCKS.properties.areas.arable),
          );
          expect(res.body.vegetationArea).toBe(
            String(MOCKS.properties.areas.vegetation),
          );
          expect(res.body.producerId).toBe(testProducerId);
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
          createdPropertyId = res.body.id;
        });
    });

    it('should create another property with different areas', () => {
      const totalArea = MOCKS.properties.areas.large.total;
      const arableArea = MOCKS.properties.areas.large.arable;
      const vegetationArea = MOCKS.properties.areas.large.vegetation;

      return request(app.getHttpServer())
        .post('/properties')
        .send(
          createPropertyData({
            name: MOCKS.properties.names.fazendaSantaRita,
            totalArea,
            arableArea,
            vegetationArea,
          }),
        )
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(MOCKS.properties.names.fazendaSantaRita);
          expect(res.body.totalArea).toBe(String(totalArea));
          expect(res.body.arableArea).toBe(String(arableArea));
          expect(res.body.vegetationArea).toBe(String(vegetationArea));
        });
    });

    it('should return 400 for non-existent producer', () => {
      return request(app.getHttpServer())
        .post('/properties')
        .send(
          createPropertyData({
            name: MOCKS.properties.names.fazendaSaoJoao,
            producerId: MOCKS.ids.nonExistent,
          }),
        )
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Producer not found');
        });
    });

    it('should return 400 when arable + vegetation area exceeds total area', () => {
      return request(app.getHttpServer())
        .post('/properties')
        .send(
          createPropertyData({
            name: MOCKS.properties.names.invalid,
            arableArea: MOCKS.properties.areas.invalid.arableExceeding,
            vegetationArea: MOCKS.properties.areas.invalid.vegetationExceeding,
          }),
        )
        .expect(400);
    });

    it('should return 400 for negative area values', () => {
      return request(app.getHttpServer())
        .post('/properties')
        .send(
          createPropertyData({
            name: MOCKS.properties.names.invalid,
            totalArea: MOCKS.properties.areas.invalid.totalNegative,
          }),
        )
        .expect(400);
    });

    it('should return 400 for invalid state format (not 2 characters)', () => {
      return request(app.getHttpServer())
        .post('/properties')
        .send(
          createPropertyData({
            name: MOCKS.properties.names.invalid,
            state: MOCKS.properties.states.invalid,
          }),
        )
        .expect(400);
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/properties')
        .send({
          name: MOCKS.properties.names.incomplete,
        })
        .expect(400);
    });

    it('should return 400 for empty name', () => {
      return request(app.getHttpServer())
        .post('/properties')
        .send(createPropertyData({ name: '' }))
        .expect(400);
    });
  });

  describe('GET /properties', () => {
    beforeEach(async () => {
      // Create test properties using helper function
      await createPropertyInDb({
        name: MOCKS.properties.names.fazendaSaoJoao,
      });

      await createPropertyInDb({
        name: MOCKS.properties.names.fazendaSantaRita,
        city: MOCKS.properties.cities.saoCarlos,
        state: MOCKS.properties.states.mg,
      });
    });

    it('should return paginated list of properties', () => {
      return request(app.getHttpServer())
        .get('/properties')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('totalCountOfRegisters');
          expect(res.body).toHaveProperty('currentPage');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThanOrEqual(2);

          // Check that each property has the expected structure
          res.body.data.forEach((property: any) => {
            expect(property).toHaveProperty('id');
            expect(property).toHaveProperty('name');
            expect(property).toHaveProperty('city');
            expect(property).toHaveProperty('state');
            expect(property).toHaveProperty('totalArea');
            expect(property).toHaveProperty('arableArea');
            expect(property).toHaveProperty('vegetationArea');
          });
        });
    });

    it('should return paginated list with custom pagination', () => {
      return request(app.getHttpServer())
        .get('/properties?currentPage=1&registersPerPage=1')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBe(1);
          expect(res.body.currentPage).toBe(1);
        });
    });

    it('should support filtering by name', () => {
      return request(app.getHttpServer())
        .get(`/properties?${filterToString({ name: 'São João' })}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
          expect(res.body.data[0].name).toContain('São João');
        });
    });

    it('should support filtering by city', () => {
      return request(app.getHttpServer())
        .get(
          `/properties?${filterToString({ city: MOCKS.properties.cities.saoCarlos })}`,
        )
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
          expect(res.body.data[0].city).toBe(MOCKS.properties.cities.saoCarlos);
        });
    });

    it('should support filtering by state', () => {
      return request(app.getHttpServer())
        .get(
          `/properties?${filterToString({ state: MOCKS.properties.states.mg })}`,
        )
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
          expect(res.body.data[0].state).toBe(MOCKS.properties.states.mg);
        });
    });

    it('should support filtering by producerId', () => {
      return request(app.getHttpServer())
        .get(`/properties?${filterToString({ producerId: testProducerId })}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThanOrEqual(2);
          res.body.data.forEach((property: any) => {
            expect(property.producerId).toBe(testProducerId);
          });
        });
    });
  });

  describe('GET /properties/producer/:producerId', () => {
    beforeEach(async () => {
      // Create test properties for the producer using helper function
      await createPropertyInDb({ name: MOCKS.properties.names.fazendaSaoJoao });
      await createPropertyInDb({
        name: MOCKS.properties.names.fazendaSantaRita,
        city: MOCKS.properties.cities.campinas,
      });
    });

    it('should return properties for a specific producer', () => {
      return request(app.getHttpServer())
        .get(`/properties/producer/${testProducerId}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThanOrEqual(2);

          // Should be ordered by createdAt desc (most recent first)
          if (res.body.data.length > 1) {
            const first = new Date(res.body.data[0].createdAt);
            const second = new Date(res.body.data[1].createdAt);
            expect(first.getTime()).toBeGreaterThanOrEqual(second.getTime());
          }
        });
    });

    it('should return 400 for non-existent producer', () => {
      return request(app.getHttpServer())
        .get('/properties/producer/non-existent-producer-id')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Producer not found');
        });
    });
  });

  describe('GET /properties/:id', () => {
    beforeEach(async () => {
      const property = await createPropertyInDb({
        name: MOCKS.properties.names.test,
      });
      createdPropertyId = property.id;
    });

    it('should return property by id', () => {
      return request(app.getHttpServer())
        .get(`/properties/${createdPropertyId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdPropertyId);
          expect(res.body.name).toBe(MOCKS.properties.names.test);
          expect(res.body.city).toBe(MOCKS.properties.cities.ribeiraoPreto);
          expect(res.body.state).toBe(MOCKS.properties.states.sp);
          expect(res.body.producerId).toBe(testProducerId);
          expect(res.body).toHaveProperty('producer');
          expect(res.body).toHaveProperty('seasons');
        });
    });

    it('should return 404 for non-existent property', () => {
      return request(app.getHttpServer())
        .get('/properties/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /properties/:id', () => {
    beforeEach(async () => {
      const property = await createPropertyInDb({
        name: MOCKS.properties.names.test,
      });
      createdPropertyId = property.id;
    });

    it('should update property name', () => {
      return request(app.getHttpServer())
        .put(`/properties/${createdPropertyId}`)
        .send({
          name: MOCKS.properties.names.updated,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdPropertyId);
          expect(res.body.name).toBe(MOCKS.properties.names.updated);
          expect(res.body.city).toBe(MOCKS.properties.cities.ribeiraoPreto);
          expect(res.body.state).toBe(MOCKS.properties.states.sp);
          expect(res.body.producerId).toBe(testProducerId);
        });
    });

    it('should update property areas', () => {
      return request(app.getHttpServer())
        .put(`/properties/${createdPropertyId}`)
        .send({
          totalArea: MOCKS.properties.areas.large.total,
          arableArea: MOCKS.properties.areas.large.arable,
          vegetationArea: MOCKS.properties.areas.large.vegetation,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.totalArea).toBe(
            String(MOCKS.properties.areas.large.total),
          );
          expect(res.body.arableArea).toBe(
            String(MOCKS.properties.areas.large.arable),
          );
          expect(res.body.vegetationArea).toBe(
            String(MOCKS.properties.areas.large.vegetation),
          );
        });
    });

    it('should update multiple fields', () => {
      return request(app.getHttpServer())
        .put(`/properties/${createdPropertyId}`)
        .send({
          name: MOCKS.properties.names.completelyUpdated,
          city: MOCKS.properties.cities.campinas,
          state: MOCKS.properties.states.mg,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe(MOCKS.properties.names.completelyUpdated);
          expect(res.body.city).toBe(MOCKS.properties.cities.campinas);
          expect(res.body.state).toBe(MOCKS.properties.states.mg);
        });
    });

    it('should return 404 for non-existent property', () => {
      return request(app.getHttpServer())
        .put('/properties/non-existent-id')
        .send({
          name: MOCKS.properties.names.updated,
        })
        .expect(404);
    });

    it('should return 400 when updated areas exceed total area', () => {
      return request(app.getHttpServer())
        .put(`/properties/${createdPropertyId}`)
        .send({
          arableArea: MOCKS.properties.areas.invalid.arableExceeding,
          vegetationArea: MOCKS.properties.areas.invalid.vegetationExceeding,
        })
        .expect(400);
    });

    it('should return 400 for invalid state format', () => {
      return request(app.getHttpServer())
        .put(`/properties/${createdPropertyId}`)
        .send({
          state: MOCKS.properties.states.invalid,
        })
        .expect(400);
    });

    it('should return 400 for empty name', () => {
      return request(app.getHttpServer())
        .put(`/properties/${createdPropertyId}`)
        .send({
          name: '',
        })
        .expect(400);
    });
  });

  describe('POST /properties/:id/attach-culture', () => {
    beforeEach(async () => {
      const property = await createPropertyInDb({
        name: MOCKS.properties.names.test,
      });
      createdPropertyId = property.id;
    });

    it('should attach culture to property successfully', () => {
      return request(app.getHttpServer())
        .post(`/properties/${createdPropertyId}/attach-culture`)
        .send({
          cultureTypeId: testCultureTypeId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBe(createdPropertyId);
        });
    });

    it('should return 400 when trying to attach same culture twice', async () => {
      // First attachment
      await request(app.getHttpServer())
        .post(`/properties/${createdPropertyId}/attach-culture`)
        .send({
          cultureTypeId: testCultureTypeId,
        })
        .expect(201);

      // Second attachment should fail
      return request(app.getHttpServer())
        .post(`/properties/${createdPropertyId}/attach-culture`)
        .send({
          cultureTypeId: testCultureTypeId,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('already attached');
        });
    });

    it('should return 400 for non-existent culture type', () => {
      return request(app.getHttpServer())
        .post(`/properties/${createdPropertyId}/attach-culture`)
        .send({
          cultureTypeId: MOCKS.ids.nonExistent,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Culture type not found');
        });
    });

    it('should return 404 for non-existent property', () => {
      return request(app.getHttpServer())
        .post('/properties/non-existent-id/attach-culture')
        .send({
          cultureTypeId: testCultureTypeId,
        })
        .expect(404);
    });

    it('should return 400 for missing cultureTypeId', () => {
      return request(app.getHttpServer())
        .post(`/properties/${createdPropertyId}/attach-culture`)
        .send({})
        .expect(400);
    });
  });

  describe('DELETE /properties/:id', () => {
    beforeEach(async () => {
      const property = await createPropertyInDb({
        name: MOCKS.properties.names.toDelete,
      });
      createdPropertyId = property.id;
    });

    it('should delete property', () => {
      return request(app.getHttpServer())
        .delete(`/properties/${createdPropertyId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdPropertyId);
          expect(res.body.name).toBe(MOCKS.properties.names.toDelete);
        });
    });

    it('should return 404 for non-existent property', () => {
      return request(app.getHttpServer())
        .delete('/properties/non-existent-id')
        .expect(404);
    });

    it('should verify property is deleted', async () => {
      await request(app.getHttpServer())
        .delete(`/properties/${createdPropertyId}`)
        .expect(200);

      return request(app.getHttpServer())
        .get(`/properties/${createdPropertyId}`)
        .expect(404);
    });
  });
});
