import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { DocumentType } from '@prisma/client';

export const UpdateProducerSchema = z.object({
  document: z.string().min(11).max(18).optional(),
  documentType: z.enum([DocumentType.CPF, DocumentType.CNPJ]).optional(),
  name: z.string().min(1).max(255).optional(),
});

export class UpdateProducerDto extends createZodDto(UpdateProducerSchema) {
  @ApiProperty({
    required: false,
    example: '12345678901',
    description: 'CPF (11 digits) or CNPJ (14 digits)',
  })
  document?: string;

  @ApiProperty({
    required: false,
    enum: DocumentType,
    example: DocumentType.CPF,
    description: 'Type of document: CPF or CNPJ',
  })
  documentType?: DocumentType;

  @ApiProperty({
    required: false,
    example: 'João Silva',
    description: 'Name of the rural producer',
  })
  name?: string;
}

export const UpdateProducerPipe = {
  transform: (value: unknown) => UpdateProducerSchema.parse(value),
};
