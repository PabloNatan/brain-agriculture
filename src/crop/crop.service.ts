import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto, UpdateCropSchema } from './dto/update-crop.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CropService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCropDto: CreateCropDto) {
    const { seasonId, cultureTypeId } = createCropDto;

    await this.verifySeasonExists(seasonId);
    await this.verifyCultureTypeExists(cultureTypeId);
    await this.verifyUniqueCropCombination(seasonId, cultureTypeId);

    return this.prisma.crop.create({
      data: createCropDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { currentPage = 1, registersPerPage = 10 } = paginationDto;
    const skip = (currentPage - 1) * registersPerPage;
    const filters = UpdateCropSchema.parse(paginationDto.filters);

    const where: Prisma.CropWhereInput = {};

    if (filters.seasonId) {
      where.seasonId = filters.seasonId;
    }

    if (filters.cultureTypeId) {
      where.cultureTypeId = filters.cultureTypeId;
    }

    if (filters.plantedArea) {
      where.plantedArea = {
        gte: filters.plantedArea,
      };
    }

    const [data, totalCountOfRegisters] = await Promise.all([
      this.prisma.crop.findMany({
        where,
        skip,
        take: registersPerPage,
        orderBy: paginationDto.orderBy,
      }),
      this.prisma.crop.count({ where }),
    ]);

    return {
      data,
      totalCountOfRegisters,
      currentPage,
    };
  }

  async findOne(id: string) {
    const crop = await this.prisma.crop.findFirst({
      where: { id },
      include: this.getIncludes(),
    });

    if (!crop) {
      throw new NotFoundException('Crop not found');
    }

    return crop;
  }

  async update(id: string, updateCropDto: UpdateCropDto) {
    await this.findOne(id);
    const { seasonId, cultureTypeId } = updateCropDto;

    if (seasonId) {
      await this.verifySeasonExists(seasonId);
    }

    if (cultureTypeId) {
      await this.verifyCultureTypeExists(cultureTypeId);
    }

    if (seasonId && cultureTypeId) {
      await this.verifyUniqueCropCombination(seasonId, cultureTypeId, id);
    }

    return this.prisma.crop.update({
      where: { id },
      data: updateCropDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.crop.delete({
      where: { id },
    });
  }

  async findBySeasonId(seasonId: string) {
    return this.prisma.crop.findMany({
      where: { seasonId },
      include: this.getIncludes(),
    });
  }

  async findByCultureTypeId(cultureTypeId: string) {
    return this.prisma.crop.findMany({
      where: { cultureTypeId },
      include: this.getIncludes(),
    });
  }

  private async verifySeasonExists(seasonId: string) {
    const season = await this.prisma.season.findFirst({
      where: { id: seasonId },
    });

    if (!season) {
      throw new BadRequestException('Season not found');
    }
  }

  private async verifyCultureTypeExists(cultureTypeId: string) {
    const cultureType = await this.prisma.cultureType.findFirst({
      where: { id: cultureTypeId },
    });

    if (!cultureType) {
      throw new BadRequestException('Culture type not found');
    }
  }

  private async verifyUniqueCropCombination(
    seasonId: string,
    cultureTypeId: string,
    excludeId?: string,
  ) {
    const existingCrop = await this.prisma.crop.findFirst({
      where: {
        seasonId,
        cultureTypeId,
        ...(excludeId
          ? {
              id: { not: excludeId },
            }
          : {}),
      },
    });

    if (existingCrop) {
      throw new BadRequestException(
        'A crop with this season and culture type combination already exists',
      );
    }
  }

  private getIncludes() {
    const includes: Prisma.CropInclude = {
      season: {
        select: {
          id: true,
          name: true,
        },
      },
      cultureType: {
        select: {
          id: true,
          title: true,
        },
      },
    };
    return includes;
  }
}
