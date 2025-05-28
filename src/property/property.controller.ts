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
import { PropertyService } from './property.service';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreatePropertyDto,
  CreatePropertyPipe,
} from './dto/create-property.dto';
import {
  UpdatePropertyDto,
  UpdatePropertyPipe,
} from './dto/update-property.dto';
import { PaginationDto, PaginationPipe } from 'src/common/dto/pagination.dto';
import { ApiPagination } from 'src/common/decorators/pagination.decorator';
import { AttachCultureDto, AttachCulturePipe } from './dto/attach-culture.dto';

@ApiTags('Properties')
@Controller('properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new property' })
  @ApiBody({ type: CreatePropertyDto })
  @ApiResponse({
    status: 201,
    description: 'The property has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid data or area validation error.',
  })
  @ApiResponse({
    status: 404,
    description: 'Producer not found.',
  })
  async create(@Body(CreatePropertyPipe) createPropertyDto: CreatePropertyDto) {
    return this.propertyService.create(createPropertyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all properties' })
  @ApiPagination()
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved properties list.',
  })
  async findAll(@Query(PaginationPipe) paginationDto: PaginationDto) {
    return this.propertyService.findAll(paginationDto);
  }

  @Get('producer/:producerId')
  @ApiOperation({ summary: 'Get properties by producer ID' })
  @ApiParam({ name: 'producerId', description: 'Producer ID' })
  @ApiPagination()
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved producer properties.',
  })
  @ApiResponse({ status: 404, description: 'Producer not found.' })
  async findByProducerId(
    @Param('producerId') producerId: string,
    @Query(PaginationPipe) paginationDto: PaginationDto,
  ) {
    return this.propertyService.findByProducerId(producerId, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved property.',
  })
  @ApiResponse({ status: 404, description: 'Property not found.' })
  async findOne(@Param('id') id: string) {
    return this.propertyService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiBody({ type: UpdatePropertyDto })
  @ApiResponse({
    status: 200,
    description: 'The property has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Property not found.' })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid data or area validation error.',
  })
  async update(
    @Param('id') id: string,
    @Body(UpdatePropertyPipe) updatePropertyDto: UpdatePropertyDto,
  ) {
    return this.propertyService.update(id, updatePropertyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({
    status: 200,
    description: 'The property has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Property not found.' })
  async remove(@Param('id') id: string) {
    return this.propertyService.remove(id);
  }

  @Post(':id/attach-culture')
  @ApiOperation({ summary: 'Attach culture type to property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiBody({ type: AttachCultureDto })
  @ApiResponse({
    status: 201,
    description: 'Culture type has been successfully attached to property.',
  })
  @ApiResponse({
    status: 404,
    description: 'Property, season, or culture type not found.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Culture already attached or validation error.',
  })
  async attachCultureToProperty(
    @Param('id') propertyId: string,
    @Body(AttachCulturePipe) attachCultureDto: AttachCultureDto,
  ) {
    return this.propertyService.attachCultureToProperty(
      propertyId,
      attachCultureDto,
    );
  }
}
