import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import {
  UpdatePropertyDto,
  UpdatePropertySchema,
} from './dto/update-property.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { AttachCultureDto } from './dto/attach-culture.dto';

@Injectable()
export class PropertyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPropertyDto: CreatePropertyDto) {
    // Verify if producer exists
    await this.verifyProducerExists(createPropertyDto.producerId);

    // Validate area constraints
    this.validateAreaConstraints(
      createPropertyDto.totalArea,
      createPropertyDto.arableArea,
      createPropertyDto.vegetationArea,
    );

    return this.prisma.property.create({
      data: {
        ...createPropertyDto,
        totalArea: new Decimal(createPropertyDto.totalArea),
        arableArea: new Decimal(createPropertyDto.arableArea),
        vegetationArea: new Decimal(createPropertyDto.vegetationArea),
      },
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { currentPage = 1, registersPerPage = 10 } = paginationDto;
    const skip = (currentPage - 1) * registersPerPage;
    const filters = UpdatePropertySchema.parse(paginationDto.filters);

    const where: Prisma.PropertyWhereInput = {};

    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    if (filters.city) {
      where.city = {
        contains: filters.city,
        mode: 'insensitive',
      };
    }

    if (filters.state) {
      where.state = {
        contains: filters.state,
        mode: 'insensitive',
      };
    }

    if (filters.producerId) {
      where.producerId = filters.producerId;
    }

    const [data, totalCountOfRegisters] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: registersPerPage,
        orderBy: paginationDto.orderBy,
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      data,
      totalCountOfRegisters,
      currentPage,
    };
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id },
      include: {
        producer: {
          select: {
            id: true,
            name: true,
            document: true,
            documentType: true,
          },
        },
        seasons: {
          include: {
            crops: {
              include: {
                cultureType: true,
              },
            },
          },
        },
        cultures: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto) {
    const existingProperty = await this.findOne(id);

    const { producerId, totalArea, arableArea, vegetationArea } =
      updatePropertyDto;

    if (producerId) {
      await this.verifyProducerExists(producerId);
    }

    if (
      totalArea !== undefined ||
      arableArea !== undefined ||
      vegetationArea !== undefined
    ) {
      this.validateAreaConstraints(
        totalArea ?? Number(existingProperty.totalArea),
        arableArea ?? Number(existingProperty.arableArea),
        vegetationArea ?? Number(existingProperty.vegetationArea),
      );
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        ...updatePropertyDto,
        totalArea: new Decimal(totalArea ?? existingProperty.totalArea),
        arableArea: new Decimal(arableArea ?? existingProperty.arableArea),
        vegetationArea: new Decimal(
          vegetationArea ?? existingProperty.vegetationArea,
        ),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.property.delete({
      where: { id },
    });
  }

  async findByProducerId(producerId: string, paginationDto?: PaginationDto) {
    // Verify if producer exists
    await this.verifyProducerExists(producerId);

    const { currentPage = 1, registersPerPage = 10 } = paginationDto || {};
    const skip = (currentPage - 1) * registersPerPage;

    const [data, totalCountOfRegisters] = await Promise.all([
      this.prisma.property.findMany({
        where: { producerId },
        skip,
        take: registersPerPage,
        orderBy: paginationDto?.orderBy || { createdAt: 'desc' },
      }),
      this.prisma.property.count({ where: { producerId } }),
    ]);

    return {
      data,
      totalCountOfRegisters,
      currentPage,
    };
  }

  async attachCultureToProperty(
    propertyId: string,
    attachCultureDto: AttachCultureDto,
  ) {
    const { cultureTypeId } = attachCultureDto;

    // Verify property exists
    const property = await this.findOne(propertyId);

    // Verify culture type exists
    const cultureType = await this.prisma.cultureType.findFirst({
      where: { id: cultureTypeId },
    });

    if (!cultureType) {
      throw new BadRequestException('Culture type not found');
    }

    // Check if culture is already attached to this property
    const existingConnection = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        cultures: {
          some: {
            id: cultureTypeId,
          },
        },
      },
    });

    if (existingConnection) {
      throw new BadRequestException(
        'Culture type is already attached to this property',
      );
    }

    // Attach the culture type to the property
    return await this.prisma.property.update({
      where: { id: propertyId },
      data: {
        cultures: {
          connect: {
            id: cultureTypeId,
          },
        },
      },
    });
  }

  private async verifyProducerExists(producerId: string) {
    const producer = await this.prisma.producer.findFirst({
      where: { id: producerId },
    });

    if (!producer) {
      throw new BadRequestException('Producer not found');
    }

    return producer;
  }

  private validateAreaConstraints(
    totalArea: number,
    arableArea: number,
    vegetationArea: number,
  ) {
    if (arableArea < 0 || vegetationArea < 0 || totalArea < 0) {
      throw new BadRequestException('Area values must be positive');
    }

    const sumAreas = arableArea + vegetationArea;
    if (sumAreas > totalArea) {
      throw new BadRequestException(
        'The sum of arable area and vegetation area cannot exceed the total area',
      );
    }
  }
}
