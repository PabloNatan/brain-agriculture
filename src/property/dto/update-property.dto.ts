import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const UpdatePropertySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    city: z.string().min(1).max(100).optional(),
    state: z.string().min(2).max(2).optional(),
    totalArea: z.number().positive().optional(),
    arableArea: z.number().positive().optional(),
    vegetationArea: z.number().positive().optional(),
    producerId: z.string().min(1).optional(),
  })
  .refine(
    (data) => {
      // Only validate if all area fields are present
      if (
        data.totalArea !== undefined &&
        data.arableArea !== undefined &&
        data.vegetationArea !== undefined
      ) {
        const total = data.arableArea + data.vegetationArea;
        return total <= data.totalArea;
      }
      return true;
    },
    {
      message:
        'The sum of arable area and vegetation area cannot exceed the total area',
      path: ['arableArea'],
    },
  );

export class UpdatePropertyDto extends createZodDto(UpdatePropertySchema) {
  @ApiProperty({
    required: false,
    example: 'Fazenda São João',
    description: 'Name of the farm/property',
  })
  name?: string;

  @ApiProperty({
    required: false,
    example: 'Ribeirão Preto',
    description: 'City where the property is located',
  })
  city?: string;

  @ApiProperty({
    required: false,
    example: 'SP',
    description: 'State abbreviation (2 characters)',
    minLength: 2,
    maxLength: 2,
  })
  state?: string;

  @ApiProperty({
    required: false,
    example: 1000.5,
    description: 'Total area of the farm in hectares',
    type: 'number',
  })
  totalArea?: number;

  @ApiProperty({
    required: false,
    example: 800.25,
    description: 'Arable area in hectares',
    type: 'number',
  })
  arableArea?: number;

  @ApiProperty({
    required: false,
    example: 200.25,
    description: 'Vegetation area in hectares',
    type: 'number',
  })
  vegetationArea?: number;

  @ApiProperty({
    required: false,
    example: 'producer-id-123',
    description: 'ID of the producer who owns this property',
  })
  producerId?: string;
}

export const UpdatePropertyPipe = {
  transform: (value: unknown) => UpdatePropertySchema.parse(value),
};
