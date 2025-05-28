import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreatePropertySchema = z
  .object({
    name: z.string().min(1).max(255),
    city: z.string().min(1).max(100),
    state: z.string().min(2).max(2),
    totalArea: z.number().positive(),
    arableArea: z.number().positive(),
    vegetationArea: z.number().positive(),
    producerId: z.string().min(1),
  })
  .refine(
    (data) => {
      const total = data.arableArea + data.vegetationArea;
      return total <= data.totalArea;
    },
    {
      message:
        'The sum of arable area and vegetation area cannot exceed the total area',
      path: ['arableArea'],
    },
  );

export class CreatePropertyDto extends createZodDto(CreatePropertySchema) {
  @ApiProperty({
    example: 'Fazenda São João',
    description: 'Name of the farm/property',
  })
  name: string;

  @ApiProperty({
    example: 'Ribeirão Preto',
    description: 'City where the property is located',
  })
  city: string;

  @ApiProperty({
    example: 'SP',
    description: 'State abbreviation (2 characters)',
    minLength: 2,
    maxLength: 2,
  })
  state: string;

  @ApiProperty({
    example: 1000.5,
    description: 'Total area of the farm in hectares',
    type: 'number',
  })
  totalArea: number;

  @ApiProperty({
    example: 800.25,
    description: 'Arable area in hectares',
    type: 'number',
  })
  arableArea: number;

  @ApiProperty({
    example: 200.25,
    description: 'Vegetation area in hectares',
    type: 'number',
  })
  vegetationArea: number;

  @ApiProperty({
    example: 'producer-id-123',
    description: 'ID of the producer who owns this property',
  })
  producerId: string;
}

export const CreatePropertyPipe = {
  transform: (value: unknown) => CreatePropertySchema.parse(value),
};
