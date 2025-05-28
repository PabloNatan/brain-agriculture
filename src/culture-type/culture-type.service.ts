// culture-type.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCultureTypeDto } from './dto/create-culture-type.dto';
import {
  UpdateCultureTypeDto,
  UpdateCultureTypeSchema,
} from './dto/update-culture-type.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CultureTypeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCultureTypeDto: CreateCultureTypeDto) {
    const { name } = createCultureTypeDto;

    await this.verifyIfNameIsAvailable(name);

    return this.prisma.cultureType.create({
      data: createCultureTypeDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { currentPage = 1, registersPerPage = 10 } = paginationDto;
    const skip = (currentPage - 1) * registersPerPage;
    const filters = UpdateCultureTypeSchema.parse(paginationDto.filters);

    const where: Prisma.CultureTypeWhereInput = {
      title: {
        contains: '',
        mode: 'insensitive',
      },
    };

    if (filters.title) {
      where.title = {
        contains: filters.title,
        mode: 'insensitive',
      };
    }

    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    const [data, totalCountOfRegisters] = await Promise.all([
      this.prisma.cultureType.findMany({
        where,
        skip,
        take: registersPerPage,
        orderBy: paginationDto.orderBy,
        include: {
          _count: {
            select: {
              crops: true,
            },
          },
        },
      }),
      this.prisma.cultureType.count({ where }),
    ]);

    return {
      data,
      totalCountOfRegisters,
      currentPage,
    };
  }

  async findOne(id: string) {
    const cultureType = await this.prisma.cultureType.findFirst({
      where: { id },
      include: {
        _count: {
          select: {
            crops: true,
          },
        },
      },
    });

    if (!cultureType) {
      throw new NotFoundException('Culture type not found');
    }

    return cultureType;
  }

  async update(id: string, updateCultureTypeDto: UpdateCultureTypeDto) {
    await this.findOne(id);
    const { name } = updateCultureTypeDto;

    if (name) {
      await this.verifyIfNameIsAvailable(name, id);
    }

    return this.prisma.cultureType.update({
      where: { id },
      data: updateCultureTypeDto,
    });
  }

  async remove(id: string) {
    const cultureType = await this.findOne(id);

    // Check if culture type is being used in any crops
    const cropsCount = cultureType._count?.crops || 0;
    if (cropsCount > 0) {
      throw new BadRequestException(
        'Cannot delete culture type that is being used in crops',
      );
    }

    return this.prisma.cultureType.delete({
      where: { id },
    });
  }

  private async verifyIfNameIsAvailable(name: string, id?: string) {
    const existingCultureType = await this.prisma.cultureType.findFirst({
      where: {
        name,
        ...(id
          ? {
              id: { not: id },
            }
          : {}),
      },
    });

    if (existingCultureType) {
      throw new BadRequestException(
        'Culture type with this name already exists',
      );
    }
  }
}
