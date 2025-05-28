// culture-type.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ZodExceptionFilter } from 'src/common/filters/zod-exception.filter';
import { cpf } from 'cpf-cnpj-validator';
import { filterToString } from 'src/common/utils/filterToString';

describe('CultureTypeController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let createdCultureTypeId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ZodExceptionFilter());

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Clean up test data
    await prisma.cultureType.deleteMany({
      where: {
        OR: [
          { name: 'soja-test' },
          { name: 'milho-test' },
          { name: 'cafe-test' },
          { name: 'algodao-test' },
          { name: 'updated-soja-test' },
          { name: 'non_existent_culture' },
        ],
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.cultureType.deleteMany({
      where: {
        OR: [
          { name: 'soja-test' },
          { name: 'milho-test' },
          { name: 'cafe-test' },
          { name: 'algodao-test' },
          { name: 'updated-soja-test' },
          { name: 'non_existent_culture' },
        ],
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /culture-types', () => {
    it('should create a new culture type', () => {
      return request(app.getHttpServer())
        .post('/culture-types')
        .send({
          title: 'Soja',
          name: 'soja-test',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe('Soja');
          expect(res.body.name).toBe('soja-test');
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
          createdCultureTypeId = res.body.id;
        });
    });

    it('should create another culture type with different name', () => {
      return request(app.getHttpServer())
        .post('/culture-types')
        .send({
          title: 'Milho',
          name: 'milho-test',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe('Milho');
          expect(res.body.name).toBe('milho-test');
        });
    });

    it('should return 400 for duplicate name', async () => {
      // First, create a culture type
      await request(app.getHttpServer())
        .post('/culture-types')
        .send({
          title: 'Café',
          name: 'cafe-test',
        })
        .expect(201);

      // Try to create another with the same name
      return request(app.getHttpServer())
        .post('/culture-types')
        .send({
          title: 'Café Arábica',
          name: 'cafe-test',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'Culture type with this name already exists',
          );
        });
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/culture-types')
        .send({
          title: 'Soja',
        })
        .expect(400);
    });

    it('should return 400 for empty title', () => {
      return request(app.getHttpServer())
        .post('/culture-types')
        .send({
          title: '',
          name: 'soja-test',
        })
        .expect(400);
    });

    it('should return 400 for empty name', () => {
      return request(app.getHttpServer())
        .post('/culture-types')
        .send({
          title: 'Soja',
          name: '',
        })
        .expect(400);
    });

    it('should return 400 for too long title', () => {
      const longTitle = 'A'.repeat(256);
      return request(app.getHttpServer())
        .post('/culture-types')
        .send({
          title: longTitle,
          name: 'soja-test',
        })
        .expect(400);
    });

    it('should return 400 for too long name', () => {
      const longName = 'a'.repeat(256);
      return request(app.getHttpServer())
        .post('/culture-types')
        .send({
          title: 'Soja',
          name: longName,
        })
        .expect(400);
    });
  });

  describe('GET /culture-types', () => {
    beforeEach(async () => {
      // Create test data
      await prisma.cultureType.create({
        data: {
          title: 'Soja',
          name: 'soja-test',
        },
      });

      await prisma.cultureType.create({
        data: {
          title: 'Milho',
          name: 'milho-test',
        },
      });
    });

    it('should return paginated list of culture types', () => {
      return request(app.getHttpServer())
        .get('/culture-types')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('totalCountOfRegisters');
          expect(res.body).toHaveProperty('currentPage');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThanOrEqual(2);

          // Check if crop count is included
          if (res.body.data.length > 0) {
            expect(res.body.data[0]).toHaveProperty('_count');
            expect(res.body.data[0]._count).toHaveProperty('crops');
          }
        });
    });

    it('should return paginated list with custom pagination', () => {
      return request(app.getHttpServer())
        .get('/culture-types?currentPage=1&registersPerPage=1')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBe(1);
          expect(res.body.currentPage).toBe(1);
        });
    });

    it('should filter by title', () => {
      return request(app.getHttpServer())
        .get('/culture-types?filters[title]=Soja')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
          const sojaItems = res.body.data.filter((item: any) =>
            item.title.toLowerCase().includes('soja'),
          );
          expect(sojaItems.length).toBeGreaterThan(0);
        });
    });

    it('should filter by name', () => {
      return request(app.getHttpServer())
        .get('/culture-types?filters[name]=milho')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
          const milhoItems = res.body.data.filter((item: any) =>
            item.name.toLowerCase().includes('milho'),
          );
          expect(milhoItems.length).toBeGreaterThan(0);
        });
    });

    it('should return empty array when no matches found', () => {
      return request(app.getHttpServer())
        .get(
          `/culture-types?${filterToString({ name: 'non_existent_culture' })}`,
        )
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBe(0);
          expect(res.body.totalCountOfRegisters).toBe(0);
        });
    });
  });

  describe('GET /culture-types/:id', () => {
    beforeEach(async () => {
      const cultureType = await prisma.cultureType.create({
        data: {
          title: 'Soja',
          name: 'soja-test',
        },
      });
      createdCultureTypeId = cultureType.id;
    });

    it('should return culture type by id', () => {
      return request(app.getHttpServer())
        .get(`/culture-types/${createdCultureTypeId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdCultureTypeId);
          expect(res.body.title).toBe('Soja');
          expect(res.body.name).toBe('soja-test');
          expect(res.body).toHaveProperty('_count');
          expect(res.body._count).toHaveProperty('crops');
        });
    });

    it('should return 404 for non-existent culture type', () => {
      return request(app.getHttpServer())
        .get('/culture-types/non-existent-id')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('Culture type not found');
        });
    });
  });

  describe('PUT /culture-types/:id', () => {
    beforeEach(async () => {
      const cultureType = await prisma.cultureType.create({
        data: {
          title: 'Soja',
          name: 'soja-test',
        },
      });
      createdCultureTypeId = cultureType.id;
    });

    it('should update culture type title', () => {
      return request(app.getHttpServer())
        .put(`/culture-types/${createdCultureTypeId}`)
        .send({
          title: 'Soja Premium',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdCultureTypeId);
          expect(res.body.title).toBe('Soja Premium');
          expect(res.body.name).toBe('soja-test');
        });
    });

    it('should update culture type name', () => {
      return request(app.getHttpServer())
        .put(`/culture-types/${createdCultureTypeId}`)
        .send({
          name: 'updated-soja-test',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('updated-soja-test');
          expect(res.body.title).toBe('Soja');
        });
    });

    it('should update both title and name', () => {
      return request(app.getHttpServer())
        .put(`/culture-types/${createdCultureTypeId}`)
        .send({
          title: 'Soja Premium',
          name: 'updated-soja-test',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Soja Premium');
          expect(res.body.name).toBe('updated-soja-test');
        });
    });

    it('should return 400 when trying to update to existing name', async () => {
      // Create another culture type
      await prisma.cultureType.create({
        data: {
          title: 'Milho',
          name: 'milho-test',
        },
      });

      return request(app.getHttpServer())
        .put(`/culture-types/${createdCultureTypeId}`)
        .send({
          name: 'milho-test',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'Culture type with this name already exists',
          );
        });
    });

    it('should return 404 for non-existent culture type', () => {
      return request(app.getHttpServer())
        .put('/culture-types/non-existent-id')
        .send({
          title: 'Updated Title',
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('Culture type not found');
        });
    });

    it('should return 400 for empty title', () => {
      return request(app.getHttpServer())
        .put(`/culture-types/${createdCultureTypeId}`)
        .send({
          title: '',
        })
        .expect(400);
    });

    it('should return 400 for empty name', () => {
      return request(app.getHttpServer())
        .put(`/culture-types/${createdCultureTypeId}`)
        .send({
          name: '',
        })
        .expect(400);
    });

    it('should return 400 for too long title', () => {
      const longTitle = 'A'.repeat(256);
      return request(app.getHttpServer())
        .put(`/culture-types/${createdCultureTypeId}`)
        .send({
          title: longTitle,
        })
        .expect(400);
    });

    it('should return 400 for too long name', () => {
      const longName = 'a'.repeat(256);
      return request(app.getHttpServer())
        .put(`/culture-types/${createdCultureTypeId}`)
        .send({
          name: longName,
        })
        .expect(400);
    });
  });

  describe('DELETE /culture-types/:id', () => {
    beforeEach(async () => {
      const cultureType = await prisma.cultureType.create({
        data: {
          title: 'Soja',
          name: 'soja-test',
        },
      });
      createdCultureTypeId = cultureType.id;
    });

    it('should delete culture type when not in use', () => {
      return request(app.getHttpServer())
        .delete(`/culture-types/${createdCultureTypeId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdCultureTypeId);
          expect(res.body.title).toBe('Soja');
          expect(res.body.name).toBe('soja-test');
        });
    });

    it('should return 404 for non-existent culture type', () => {
      return request(app.getHttpServer())
        .delete('/culture-types/non-existent-id')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('Culture type not found');
        });
    });

    it('should verify culture type is deleted', async () => {
      await request(app.getHttpServer())
        .delete(`/culture-types/${createdCultureTypeId}`)
        .expect(200);

      return request(app.getHttpServer())
        .get(`/culture-types/${createdCultureTypeId}`)
        .expect(404);
    });

    it('should return 400 when trying to delete culture type in use', async () => {
      // Create a producer and property first
      const producer = await prisma.producer.create({
        data: {
          document: cpf.generate(),
          documentType: 'CPF',
          name: 'Test Producer',
        },
      });

      const property = await prisma.property.create({
        data: {
          name: 'Test Farm',
          city: 'Test City',
          state: 'TS',
          totalArea: 100.0,
          arableArea: 80.0,
          vegetationArea: 20.0,
          producerId: producer.id,
        },
      });

      const season = await prisma.season.create({
        data: {
          name: 'Test Season',
          year: 2024,
          propertyId: property.id,
        },
      });

      // Create a crop using the culture type
      await prisma.crop.create({
        data: {
          plantedArea: 50.0,
          seasonId: season.id,
          cultureTypeId: createdCultureTypeId,
        },
      });

      await request(app.getHttpServer())
        .delete(`/culture-types/${createdCultureTypeId}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'Cannot delete culture type that is being used in crops',
          );
        });

      await prisma.season.delete({ where: { id: season.id } });
      await prisma.property.delete({ where: { id: property.id } });
      await prisma.producer.delete({ where: { id: producer.id } });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete CRUD workflow', async () => {
      // Create
      const createResponse = await request(app.getHttpServer())
        .post('/culture-types')
        .send({
          title: 'Algodão',
          name: 'algodao-test',
        })
        .expect(201);

      const cultureTypeId = createResponse.body.id;

      // Read (single)
      await request(app.getHttpServer())
        .get(`/culture-types/${cultureTypeId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Algodão');
          expect(res.body.name).toBe('algodao-test');
        });

      // Update
      await request(app.getHttpServer())
        .put(`/culture-types/${cultureTypeId}`)
        .send({
          title: 'Algodão Premium',
        })
        .expect(200);

      // Verify update
      await request(app.getHttpServer())
        .get(`/culture-types/${cultureTypeId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Algodão Premium');
          expect(res.body.name).toBe('algodao-test');
        });

      // Delete
      await request(app.getHttpServer())
        .delete(`/culture-types/${cultureTypeId}`)
        .expect(200);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/culture-types/${cultureTypeId}`)
        .expect(404);
    });

    it('should maintain data consistency across operations', async () => {
      // Create multiple culture types
      const cultureTypes = await Promise.all([
        request(app.getHttpServer())
          .post('/culture-types')
          .send({ title: 'Soja', name: 'soja-test' }),
        request(app.getHttpServer())
          .post('/culture-types')
          .send({ title: 'Milho', name: 'milho-test' }),
        request(app.getHttpServer())
          .post('/culture-types')
          .send({ title: 'Café', name: 'cafe-test' }),
      ]);

      // Verify all were created
      expect(cultureTypes.every((res) => res.status === 201)).toBe(true);

      // Get all culture types
      const listResponse = await request(app.getHttpServer())
        .get('/culture-types')
        .expect(200);

      expect(listResponse.body.data.length).toBeGreaterThanOrEqual(3);

      // Test filtering
      const filteredResponse = await request(app.getHttpServer())
        .get('/culture-types?filters[title]=Soja')
        .expect(200);

      expect(
        filteredResponse.body.data.some((ct: any) => ct.title === 'Soja'),
      ).toBe(true);
    });
  });
});
