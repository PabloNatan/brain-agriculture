import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateCultureTypeSchema = z.object({
  title: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
});

export class CreateCultureTypeDto extends createZodDto(
  CreateCultureTypeSchema,
) {
  @ApiProperty({
    example: 'Soja',
    description: 'Display title of the culture type',
  })
  title: string;

  @ApiProperty({
    example: 'soja',
    description: 'Unique name identifier for the culture type',
  })
  name: string;
}

export const CreateCultureTypePipe = {
  transform: (value: unknown) => CreateCultureTypeSchema.parse(value),
};
