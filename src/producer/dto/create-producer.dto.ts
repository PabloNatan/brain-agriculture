import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { DocumentType } from '@prisma/client';

export const CreateProducerSchema = z.object({
  document: z.string().min(11).max(18),
  documentType: z.enum([DocumentType.CPF, DocumentType.CNPJ]),
  name: z.string().min(1).max(255),
});

export class CreateProducerDto extends createZodDto(CreateProducerSchema) {
  @ApiProperty({
    example: '12345678901',
    description: 'CPF (11 digits) or CNPJ (14 digits)',
  })
  document: string;

  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.CPF,
    description: 'Type of document: CPF or CNPJ',
  })
  documentType: DocumentType;

  @ApiProperty({
    example: 'João Silva',
    description: 'Name of the rural producer',
  })
  name: string;
}

export const CreateProducerPipe = {
  transform: (value: unknown) => CreateProducerSchema.parse(value),
};
