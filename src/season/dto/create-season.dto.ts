import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateSeasonSchema = z.object({
  name: z.string().min(1).max(255),
  year: z.number().int().min(1900).max(2100),
  propertyId: z.string().cuid(),
});

export class CreateSeasonDto extends createZodDto(CreateSeasonSchema) {
  @ApiProperty({
    example: 'Safra 2024',
    description: 'Name of the season',
  })
  name: string;

  @ApiProperty({
    example: 2024,
    description: 'Year of the season',
  })
  year: number;

  @ApiProperty({
    example: 'cm1234567890abcdef',
    description: 'ID of the property this season belongs to',
  })
  propertyId: string;
}

export const CreateSeasonPipe = {
  transform: (value: unknown) => CreateSeasonSchema.parse(value),
};
