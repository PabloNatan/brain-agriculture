import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const UpdateSeasonSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  propertyId: z.string().cuid().optional(),
});

export class UpdateSeasonDto extends createZodDto(UpdateSeasonSchema) {
  @ApiProperty({
    required: false,
    example: 'Safra 2024',
    description: 'Name of the season',
  })
  name?: string;

  @ApiProperty({
    required: false,
    example: 2024,
    description: 'Year of the season',
  })
  year?: number;

  @ApiProperty({
    required: false,
    example: 'cm1234567890abcdef',
    description: 'ID of the property this season belongs to',
  })
  propertyId?: string;
}

export const UpdateSeasonPipe = {
  transform: (value: unknown) => UpdateSeasonSchema.parse(value),
};
