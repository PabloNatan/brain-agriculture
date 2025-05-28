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
import { SeasonService } from './season.service';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateSeasonDto, CreateSeasonPipe } from './dto/create-season.dto';
import { UpdateSeasonDto, UpdateSeasonPipe } from './dto/update-season.dto';
import { PaginationDto, PaginationPipe } from 'src/common/dto/pagination.dto';
import { ApiPagination } from 'src/common/decorators/pagination.decorator';

@ApiTags('Seasons')
@Controller('seasons')
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new season' })
  @ApiBody({ type: CreateSeasonDto })
  @ApiResponse({
    status: 201,
    description: 'The season has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Property not found or season already exists.',
  })
  async create(@Body(CreateSeasonPipe) createSeasonDto: CreateSeasonDto) {
    return this.seasonService.create(createSeasonDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all seasons for the application' })
  @ApiPagination()
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved seasons list.',
  })
  async findAll(@Query(PaginationPipe) paginationDto: PaginationDto) {
    return this.seasonService.findAll(paginationDto);
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Get all seasons for a specific property' })
  @ApiParam({ name: 'propertyId', description: 'Property ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved seasons for the property.',
  })
  @ApiResponse({ status: 400, description: 'Property not found.' })
  async findByProperty(@Param('propertyId') propertyId: string) {
    return this.seasonService.findByProperty(propertyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get season by ID' })
  @ApiParam({ name: 'id', description: 'Season ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved season.',
  })
  @ApiResponse({ status: 404, description: 'Season not found.' })
  async findOne(@Param('id') id: string) {
    return this.seasonService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update season' })
  @ApiParam({ name: 'id', description: 'Season ID' })
  @ApiBody({ type: UpdateSeasonDto })
  @ApiResponse({
    status: 200,
    description: 'The season has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Season not found.' })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Property not found or season already exists.',
  })
  async update(
    @Param('id') id: string,
    @Body(UpdateSeasonPipe) updateSeasonDto: UpdateSeasonDto,
  ) {
    return this.seasonService.update(id, updateSeasonDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete season' })
  @ApiParam({ name: 'id', description: 'Season ID' })
  @ApiResponse({
    status: 200,
    description: 'The season has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Season not found.' })
  async remove(@Param('id') id: string) {
    return this.seasonService.remove(id);
  }
}
