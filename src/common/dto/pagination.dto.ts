import { z } from 'zod';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';

export const PaginationSchema = z
  .object({
    currentPage: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : 1)),
    registersPerPage: z
      .string()
      .optional()
      .transform((val) => (val ? Math.min(Number(val), 100) : 10)),
    'order[columnName]': z.string().optional(),
    'order[order]': z.enum(['asc', 'desc']).optional().default('asc'),
    filters: z
      .string()
      .optional()
      .refine(
        (val: string) => {
          if (!val) return true;
          try {
            JSON.parse(val);
            return true;
          } catch (e) {
            return false;
          }
        },
        {
          message: 'String must contain valid JSON',
        },
      )
      .transform((val) => {
        if (!val) {
          return undefined;
        }
        return JSON.parse(val);
      })
      .default('{}'),
  })
  .transform((val) => {
    const columnName = val['order[columnName]'];
    if (!columnName) {
      return val;
    }

    return {
      ...val,
      orderBy: {
        [columnName]: val['order[order]'],
      },
    };
  });

export type PaginationDto = z.infer<typeof PaginationSchema> & {
  orderBy?: {
    [key: string]: 'asc' | 'desc';
  };
};

export const PaginationPipe = new ZodValidationPipe(PaginationSchema);
