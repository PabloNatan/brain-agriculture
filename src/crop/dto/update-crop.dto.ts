import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const UpdateCropSchema = z.object({
  seasonId: z.string().min(1, 'Season ID is required').optional(),
  cultureTypeId: z.string().min(1, 'Culture Type ID is required').optional(),
  plantedArea: z.number().positive('Planted area must be positive').optional(),
});

export class UpdateCropDto extends createZodDto(UpdateCropSchema) {
  @ApiProperty({
    required: false,
    example: 'clx1234567890',
    description: 'Season ID',
  })
  seasonId?: string;

  @ApiProperty({
    required: false,
    example: 'clx0987654321',
    description: 'Culture Type ID',
  })
  cultureTypeId?: string;

  @ApiProperty({
    required: false,
    example: 100.5,
    description: 'Planted area in hectares',
  })
  plantedArea?: number;
}

export const UpdateCropPipe = {
  transform: (value: unknown) => UpdateCropSchema.parse(value),
};
