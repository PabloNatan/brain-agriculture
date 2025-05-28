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
import { ProducerService } from './producer.service';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateProducerDto,
  CreateProducerPipe,
} from './dto/create-producer.dto';
import {
  UpdateProducerDto,
  UpdateProducerPipe,
} from './dto/update-producer.dto';
import { PaginationDto, PaginationPipe } from 'src/common/dto/pagination.dto';
import { ApiPagination } from 'src/common/decorators/pagination.decorator';

@ApiTags('Producers')
@Controller('producers')
export class ProducerController {
  constructor(private readonly producerService: ProducerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new producer' })
  @ApiBody({ type: CreateProducerDto })
  @ApiResponse({
    status: 201,
    description: 'The producer has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid CPF/CNPJ or validation error.',
  })
  async create(@Body(CreateProducerPipe) createProducerDto: CreateProducerDto) {
    return this.producerService.create(createProducerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all producers for the application' })
  @ApiPagination()
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved producers list.',
  })
  async findAll(@Query(PaginationPipe) paginationDto: PaginationDto) {
    return this.producerService.findAll(paginationDto);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get producers dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved dashboard statistics.',
  })
  async getDashboard() {
    return this.producerService.getDashboard();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get producer by ID' })
  @ApiParam({ name: 'id', description: 'Producer ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved producer.',
  })
  @ApiResponse({ status: 404, description: 'Producer not found.' })
  async findOne(@Param('id') id: string) {
    return this.producerService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update producer' })
  @ApiParam({ name: 'id', description: 'Producer ID' })
  @ApiBody({ type: UpdateProducerDto })
  @ApiResponse({
    status: 200,
    description: 'The producer has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Producer not found.' })
  async update(
    @Param('id') id: string,
    @Body(UpdateProducerPipe) updateProducerDto: UpdateProducerDto,
  ) {
    return this.producerService.update(id, updateProducerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete producer' })
  @ApiParam({ name: 'id', description: 'Producer ID' })
  @ApiResponse({
    status: 200,
    description: 'The producer has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Producer not found.' })
  async remove(@Param('id') id: string) {
    return this.producerService.remove(id);
  }
}
