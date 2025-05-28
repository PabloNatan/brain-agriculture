import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateCultureTypeSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  name: z.string().min(1).max(255).optional(),
});

export class UpdateCultureTypeDto extends createZodDto(
  UpdateCultureTypeSchema,
) {
  @ApiProperty({
    required: false,
    example: 'Soja',
    description: 'Display title of the culture type',
  })
  title?: string;

  @ApiProperty({
    required: false,
    example: 'soja',
    description: 'Unique name identifier for the culture type',
  })
  name?: string;
}

export const UpdateCultureTypePipe = {
  transform: (value: unknown) => UpdateCultureTypeSchema.parse(value),
};
