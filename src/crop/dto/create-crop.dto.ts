import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateCropSchema = z.object({
  seasonId: z.string().min(1, 'Season ID is required'),
  cultureTypeId: z.string().min(1, 'Culture Type ID is required'),
  plantedArea: z.number().positive('Planted area must be positive').optional(),
});

export class CreateCropDto extends createZodDto(CreateCropSchema) {
  @ApiProperty({
    example: 'clx1234567890',
    description: 'Season ID',
  })
  seasonId: string;

  @ApiProperty({
    example: 'clx0987654321',
    description: 'Culture Type ID',
  })
  cultureTypeId: string;

  @ApiProperty({
    required: false,
    example: 100.5,
    description: 'Planted area in hectares',
  })
  plantedArea?: number;
}

export const CreateCropPipe = {
  transform: (value: unknown) => CreateCropSchema.parse(value),
};
