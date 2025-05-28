import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CropService } from './crop.service';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateCropDto, CreateCropPipe } from './dto/create-crop.dto';
import { UpdateCropDto, UpdateCropPipe } from './dto/update-crop.dto';
import { PaginationDto, PaginationPipe } from 'src/common/dto/pagination.dto';
import { ApiPagination } from 'src/common/decorators/pagination.decorator';

@ApiTags('Crops')
@Controller('crops')
export class CropController {
  constructor(private readonly cropService: CropService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new crop' })
  @ApiBody({ type: CreateCropDto })
  @ApiResponse({
    status: 201,
    description: 'The crop has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Invalid season/culture type or validation error.',
  })
  async create(@Body(CreateCropPipe) createCropDto: CreateCropDto) {
    return this.cropService.create(createCropDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all crops for the application' })
  @ApiPagination()
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved crops list.',
  })
  async findAll(@Query(PaginationPipe) paginationDto: PaginationDto) {
    return this.cropService.findAll(paginationDto);
  }

  @Get('by-season/:seasonId')
  @ApiOperation({ summary: 'Get crops by season ID' })
  @ApiParam({ name: 'seasonId', description: 'Season ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved crops by season.',
  })
  async findBySeasonId(@Param('seasonId') seasonId: string) {
    return this.cropService.findBySeasonId(seasonId);
  }

  @Get('by-culture-type/:cultureTypeId')
  @ApiOperation({ summary: 'Get crops by culture type ID' })
  @ApiParam({ name: 'cultureTypeId', description: 'Culture Type ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved crops by culture type.',
  })
  async findByCultureTypeId(@Param('cultureTypeId') cultureTypeId: string) {
    return this.cropService.findByCultureTypeId(cultureTypeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get crop by ID' })
  @ApiParam({ name: 'id', description: 'Crop ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved crop.',
  })
  @ApiResponse({ status: 404, description: 'Crop not found.' })
  async findOne(@Param('id') id: string) {
    return this.cropService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update crop' })
  @ApiParam({ name: 'id', description: 'Crop ID' })
  @ApiBody({ type: UpdateCropDto })
  @ApiResponse({
    status: 200,
    description: 'The crop has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Crop not found.' })
  async update(
    @Param('id') id: string,
    @Body(UpdateCropPipe) updateCropDto: UpdateCropDto,
  ) {
    return this.cropService.update(id, updateCropDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete crop' })
  @ApiParam({ name: 'id', description: 'Crop ID' })
  @ApiResponse({
    status: 200,
    description: 'The crop has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Crop not found.' })
  async remove(@Param('id') id: string) {
    return this.cropService.remove(id);
  }
}
