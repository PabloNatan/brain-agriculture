// culture-type.controller.ts
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
import { CultureTypeService } from './culture-type.service';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateCultureTypeDto,
  CreateCultureTypePipe,
} from './dto/create-culture-type.dto';
import {
  UpdateCultureTypeDto,
  UpdateCultureTypePipe,
} from './dto/update-culture-type.dto';
import { PaginationDto, PaginationPipe } from 'src/common/dto/pagination.dto';
import { ApiPagination } from 'src/common/decorators/pagination.decorator';

@ApiTags('Culture Types')
@Controller('culture-types')
export class CultureTypeController {
  constructor(private readonly cultureTypeService: CultureTypeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new culture type' })
  @ApiBody({ type: CreateCultureTypeDto })
  @ApiResponse({
    status: 201,
    description: 'The culture type has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request. Culture type name already exists or validation error.',
  })
  async create(
    @Body(CreateCultureTypePipe) createCultureTypeDto: CreateCultureTypeDto,
  ) {
    return this.cultureTypeService.create(createCultureTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all culture types for the application' })
  @ApiPagination()
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved culture types list.',
  })
  async findAll(@Query(PaginationPipe) paginationDto: PaginationDto) {
    return this.cultureTypeService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get culture type by ID' })
  @ApiParam({ name: 'id', description: 'Culture Type ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved culture type.',
  })
  @ApiResponse({ status: 404, description: 'Culture type not found.' })
  async findOne(@Param('id') id: string) {
    return this.cultureTypeService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update culture type' })
  @ApiParam({ name: 'id', description: 'Culture Type ID' })
  @ApiBody({ type: UpdateCultureTypeDto })
  @ApiResponse({
    status: 200,
    description: 'The culture type has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Culture type not found.' })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Culture type name already exists.',
  })
  async update(
    @Param('id') id: string,
    @Body(UpdateCultureTypePipe) updateCultureTypeDto: UpdateCultureTypeDto,
  ) {
    return this.cultureTypeService.update(id, updateCultureTypeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete culture type' })
  @ApiParam({ name: 'id', description: 'Culture Type ID' })
  @ApiResponse({
    status: 200,
    description: 'The culture type has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Culture type not found.' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete culture type that is being used in crops.',
  })
  async remove(@Param('id') id: string) {
    return this.cultureTypeService.remove(id);
  }
}
