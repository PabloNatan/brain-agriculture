import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProducerDto } from './dto/create-producer.dto';
import { cnpj, cpf } from 'cpf-cnpj-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import {
  UpdateProducerDto,
  UpdateProducerSchema,
} from './dto/update-producer.dto';
import { DocumentType, Prisma } from '@prisma/client';

@Injectable()
export class ProducerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProducerDto: CreateProducerDto) {
    const { document, documentType } = createProducerDto;

    await this.verifyIfDocumentIsAvailable(document);

    this.validateDocument(document, documentType);

    return this.prisma.producer.create({
      data: createProducerDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { currentPage = 1, registersPerPage = 10 } = paginationDto;
    const skip = (currentPage - 1) * registersPerPage;
    const filters = UpdateProducerSchema.parse(paginationDto.filters);

    const where: Prisma.ProducerWhereInput = {
      name: {
        contains: '',
        mode: 'insensitive',
      },
    };

    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    if (filters.document) {
      where.document = {
        contains: filters.document,
      };
    }

    const [data, totalCountOfRegisters] = await Promise.all([
      this.prisma.producer.findMany({
        where,
        skip,
        take: registersPerPage,
        orderBy: paginationDto.orderBy,
      }),
      this.prisma.producer.count({ where }),
    ]);

    return {
      data,
      totalCountOfRegisters,
      currentPage,
    };
  }

  async findOne(id: string) {
    const producer = await this.prisma.producer.findFirst({
      where: { id },
    });

    if (!producer) {
      throw new NotFoundException('Producer not found');
    }

    return producer;
  }

  async update(id: string, updateProducerDto: UpdateProducerDto) {
    await this.findOne(id);
    const { document, documentType } = updateProducerDto;

    if (document && documentType) {
      this.validateDocument(document, documentType);
      await this.verifyIfDocumentIsAvailable(document, id);
    }

    return this.prisma.producer.update({
      where: { id },
      data: updateProducerDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.producer.delete({
      where: { id },
    });
  }

  async getDashboard() {
    // Get total farms count
    const totalFarms = await this.prisma.property.count();

    // Get total hectares (sum of all total areas)
    const totalHectaresResult = await this.prisma.property.aggregate({
      _sum: {
        totalArea: true,
      },
    });

    // Get farms by state
    const farmsByState = await this.prisma.property.groupBy({
      by: ['state'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Get farms by culture (from crops)
    const farmsByCulture = await this.prisma.crop.groupBy({
      by: ['cultureTypeId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Get culture type names
    const cultureTypes = await this.prisma.cultureType.findMany({
      where: {
        id: {
          in: farmsByCulture.map((item) => item.cultureTypeId),
        },
      },
    });

    const farmsByCultureWithNames = farmsByCulture.map((item) => ({
      ...item,
      cultureName:
        cultureTypes.find((ct) => ct.id === item.cultureTypeId)?.name ||
        'Unknown',
    }));

    // Get land use distribution
    const landUseResult = await this.prisma.property.aggregate({
      _sum: {
        arableArea: true,
        vegetationArea: true,
      },
    });

    const landUse = [
      {
        type: 'Área Agricultável',
        value: landUseResult._sum.arableArea || 0,
      },
      {
        type: 'Área de Vegetação',
        value: landUseResult._sum.vegetationArea || 0,
      },
    ];

    return {
      totalFarms,
      totalHectares: totalHectaresResult._sum.totalArea || 0,
      charts: {
        farmsByState: farmsByState.map((item) => ({
          state: item.state,
          count: item._count.id,
        })),
        farmsByCulture: farmsByCultureWithNames.map((item) => ({
          culture: item.cultureName,
          count: item._count.id,
        })),
        landUse,
      },
    };
  }

  private async verifyIfDocumentIsAvailable(document: string, id?: string) {
    const existingProducer = await this.prisma.producer.findFirst({
      where: {
        document,
        ...(id
          ? {
              id: { not: id },
            }
          : {}),
      },
    });

    if (existingProducer) {
      throw new BadRequestException(
        'Producer with this document already exists',
      );
    }
  }

  private validateDocument(document: string, documentType: DocumentType) {
    const isValidDocument =
      documentType === DocumentType.CPF
        ? cpf.isValid(document)
        : cnpj.isValid(document);

    if (!isValidDocument) {
      throw new BadRequestException(`Invalid ${documentType} format`);
    }
  }
}
