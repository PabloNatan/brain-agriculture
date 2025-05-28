import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto, UpdateSeasonSchema } from './dto/update-season.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SeasonService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSeasonDto: CreateSeasonDto) {
    const { propertyId, name, year } = createSeasonDto;

    await this.verifyPropertyExists(propertyId);
    await this.verifySeasonUniqueness(propertyId, name, year);

    return this.prisma.season.create({
      data: createSeasonDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { currentPage = 1, registersPerPage = 10 } = paginationDto;
    const skip = (currentPage - 1) * registersPerPage;
    const filters = UpdateSeasonSchema.parse(paginationDto.filters);

    const where: Prisma.SeasonWhereInput = {};

    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive',
      };
    }

    if (filters.year) {
      where.year = filters.year;
    }

    if (filters.propertyId) {
      where.propertyId = filters.propertyId;
    }

    const [data, totalCountOfRegisters] = await Promise.all([
      this.prisma.season.findMany({
        where,
        skip,
        take: registersPerPage,
        orderBy: paginationDto.orderBy,
      }),
      this.prisma.season.count({ where }),
    ]);

    return {
      data,
      totalCountOfRegisters,
      currentPage,
    };
  }

  async findOne(id: string) {
    const season = await this.prisma.season.findFirst({
      where: { id },
      include: this.getIncludes(),
    });

    if (!season) {
      throw new NotFoundException('Season not found');
    }

    return season;
  }

  async findByProperty(propertyId: string) {
    await this.verifyPropertyExists(propertyId);

    return this.prisma.season.findMany({
      where: { propertyId },
      include: this.getIncludes(),
      orderBy: {
        year: 'desc',
      },
    });
  }

  async update(id: string, updateSeasonDto: UpdateSeasonDto) {
    const currentSeason = await this.findOne(id);

    const { propertyId, name, year } = updateSeasonDto;

    if (propertyId) {
      await this.verifyPropertyExists(propertyId);
    }

    // Check uniqueness if name, year, or propertyId is being updated
    if (name || year || propertyId) {
      const finalName = name || currentSeason.name;
      const finalYear = year || currentSeason.year;
      const finalPropertyId = propertyId || currentSeason.propertyId;

      await this.verifySeasonUniqueness(
        finalPropertyId,
        finalName,
        finalYear,
        id,
      );
    }

    return this.prisma.season.update({
      where: { id },
      data: updateSeasonDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.season.delete({
      where: { id },
    });
  }

  private async verifyPropertyExists(propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId },
    });

    if (!property) {
      throw new BadRequestException('Property not found');
    }
  }

  private async verifySeasonUniqueness(
    propertyId: string,
    name: string,
    year: number,
    excludeId?: string,
  ) {
    const existingSeason = await this.prisma.season.findFirst({
      where: {
        propertyId,
        name,
        year,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    if (existingSeason) {
      throw new BadRequestException(
        'Season with this name and year already exists for this property',
      );
    }
  }

  private getIncludes() {
    const includes: Prisma.SeasonInclude = {
      property: {
        select: {
          id: true,
          name: true,
        },
      },
      crops: {
        select: {
          id: true,
          cultureType: {
            select: {
              name: true,
            },
          },
        },
      },
    };
    return includes;
  }
}
