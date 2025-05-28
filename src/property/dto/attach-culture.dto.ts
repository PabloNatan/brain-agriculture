import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const AttachCultureSchema = z.object({
  cultureTypeId: z.string().min(1),
});

export class AttachCultureDto extends createZodDto(AttachCultureSchema) {
  @ApiProperty({
    example: 'culture-type-id-123',
    description: 'ID of the culture type to attach to the property',
  })
  cultureTypeId: string;
}

export const AttachCulturePipe = {
  transform: (value: unknown) => AttachCultureSchema.parse(value),
};
