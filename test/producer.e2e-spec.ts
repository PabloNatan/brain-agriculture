import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { DocumentType } from '@prisma/client';
import { cnpj, cpf } from 'cpf-cnpj-validator';
import { ZodExceptionFilter } from 'src/common/filters/zod-exception.filter';

describe('ProducerController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let createdProducerId: string;
  const cpf1 = cpf.generate();
  const cnpj1 = cnpj.generate();

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ZodExceptionFilter());

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Clean up test data
    await prisma.producer.deleteMany({
      where: {
        OR: [
          { document: cpf1 },
          { document: cnpj1 },
          { document: '09441517011' },
          { document: '11111111111' },
          { document: 'invalid' },
        ],
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.producer.deleteMany({
      where: {
        OR: [
          { document: cpf1 },
          { document: cnpj1 },
          { document: '98765432109' },
          { document: '11111111111' },
          { document: 'invalid' },
        ],
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /producers', () => {
    it('should create a new producer with CPF', () => {
      return request(app.getHttpServer())
        .post('/producers')
        .send({
          document: cpf1,
          documentType: DocumentType.CPF,
          name: 'João Silva',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.document).toBe(cpf1);
          expect(res.body.documentType).toBe(DocumentType.CPF);
          expect(res.body.name).toBe('João Silva');
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
          createdProducerId = res.body.id;
        });
    });

    it('should create a new producer with CNPJ', () => {
      return request(app.getHttpServer())
        .post('/producers')
        .send({
          document: cnpj1,
          documentType: DocumentType.CNPJ,
          name: 'Empresa Rural LTDA',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.document).toBe(cnpj1);
          expect(res.body.documentType).toBe(DocumentType.CNPJ);
          expect(res.body.name).toBe('Empresa Rural LTDA');
        });
    });

    it('should return 400 for invalid document length', () => {
      return request(app.getHttpServer())
        .post('/producers')
        .send({
          document: '123',
          documentType: DocumentType.CPF,
          name: 'João Silva',
        })
        .expect(400);
    });

    it('should return 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/producers')
        .send({
          document: cnpj1,
        })
        .expect(400);
    });

    it('should return 400 for empty name', () => {
      return request(app.getHttpServer())
        .post('/producers')
        .send({
          document: '11111111111',
          documentType: DocumentType.CPF,
          name: '',
        })
        .expect(400);
    });

    it('should return 400 for invalid document type', () => {
      return request(app.getHttpServer())
        .post('/producers')
        .send({
          document: cnpj1,
          documentType: 'INVALID',
          name: 'João Silva',
        })
        .expect(400);
    });
  });

  describe('GET /producers', () => {
    beforeEach(async () => {
      // Create test data
      await prisma.producer.create({
        data: {
          document: cnpj1,
          documentType: DocumentType.CPF,
          name: 'João Silva',
        },
      });

      await prisma.producer.create({
        data: {
          document: '98765432109',
          documentType: DocumentType.CPF,
          name: 'Maria Santos',
        },
      });
    });

    it('should return paginated list of producers', () => {
      return request(app.getHttpServer())
        .get('/producers')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('totalCountOfRegisters');
          expect(res.body).toHaveProperty('currentPage');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThanOrEqual(2);
        });
    });

    it('should return paginated list with custom pagination', () => {
      return request(app.getHttpServer())
        .get('/producers?currentPage=1&registersPerPage=1')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBe(1);
          expect(res.body.currentPage).toBe(1);
        });
    });
  });

  describe('GET /producers/dashboard', () => {
    beforeEach(async () => {
      // Create test producer and property data
      const producer = await prisma.producer.create({
        data: {
          document: cnpj1,
          documentType: DocumentType.CPF,
          name: 'João Silva',
        },
      });

      await prisma.property.create({
        data: {
          name: 'Fazenda Teste',
          city: 'São Paulo',
          state: 'SP',
          totalArea: 100.0,
          arableArea: 80.0,
          vegetationArea: 20.0,
          producerId: producer.id,
        },
      });
    });

    it('should return dashboard statistics', () => {
      return request(app.getHttpServer())
        .get('/producers/dashboard')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalFarms');
          expect(res.body).toHaveProperty('totalHectares');
          expect(res.body).toHaveProperty('charts');
          expect(res.body.charts).toHaveProperty('farmsByCulture');
          expect(res.body.charts).toHaveProperty('landUse');
          expect(typeof res.body.totalFarms).toBe('number');
          expect(typeof res.body.totalHectares).toBe('string');
        });
    });
  });

  describe('GET /producers/:id', () => {
    beforeEach(async () => {
      const producer = await prisma.producer.create({
        data: {
          document: cnpj1,
          documentType: DocumentType.CPF,
          name: 'João Silva',
        },
      });
      createdProducerId = producer.id;
    });

    it('should return producer by id', () => {
      return request(app.getHttpServer())
        .get(`/producers/${createdProducerId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdProducerId);
          expect(res.body.document).toBe(cnpj1);
          expect(res.body.name).toBe('João Silva');
        });
    });

    it('should return 404 for non-existent producer', () => {
      return request(app.getHttpServer())
        .get('/producers/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /producers/:id', () => {
    beforeEach(async () => {
      const producer = await prisma.producer.create({
        data: {
          document: cnpj1,
          documentType: DocumentType.CPF,
          name: 'João Silva',
        },
      });
      createdProducerId = producer.id;
    });

    it('should update producer name', () => {
      return request(app.getHttpServer())
        .put(`/producers/${createdProducerId}`)
        .send({
          name: 'João Silva Updated',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdProducerId);
          expect(res.body.name).toBe('João Silva Updated');
          expect(res.body.document).toBe(cnpj1);
        });
    });

    it('should update producer document and documentType', () => {
      return request(app.getHttpServer())
        .put(`/producers/${createdProducerId}`)
        .send({
          document: '12345678000195',
          documentType: DocumentType.CNPJ,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.document).toBe('12345678000195');
          expect(res.body.documentType).toBe(DocumentType.CNPJ);
        });
    });

    it('should return 404 for non-existent producer', () => {
      return request(app.getHttpServer())
        .put('/producers/non-existent-id')
        .send({
          name: 'Updated Name',
        })
        .expect(404);
    });

    it('should return 400 for invalid document length', () => {
      return request(app.getHttpServer())
        .put(`/producers/${createdProducerId}`)
        .send({
          document: '123',
        })
        .expect(400);
    });

    it('should return 400 for empty name', () => {
      return request(app.getHttpServer())
        .put(`/producers/${createdProducerId}`)
        .send({
          name: '',
        })
        .expect(400);
    });
  });

  describe('DELETE /producers/:id', () => {
    beforeEach(async () => {
      const producer = await prisma.producer.create({
        data: {
          document: cnpj1,
          documentType: DocumentType.CPF,
          name: 'João Silva',
        },
      });
      createdProducerId = producer.id;
    });

    it('should delete producer', () => {
      return request(app.getHttpServer())
        .delete(`/producers/${createdProducerId}`)
        .expect(200);
    });

    it('should return 404 for non-existent producer', () => {
      return request(app.getHttpServer())
        .delete('/producers/non-existent-id')
        .expect(404);
    });

    it('should verify producer is deleted', async () => {
      await request(app.getHttpServer())
        .delete(`/producers/${createdProducerId}`)
        .expect(200);

      return request(app.getHttpServer())
        .get(`/producers/${createdProducerId}`)
        .expect(404);
    });
  });
});
