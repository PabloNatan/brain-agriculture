import { applyDecorators } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiPagination(options?: {
  maxRegistersPerPage?: number;
  defaultRegistersPerPage?: number;
  includeFilters?: boolean;
  includeOrder?: boolean;
  additionalResponses?: Array<{ status: number; description: string }>;
}) {
  const {
    maxRegistersPerPage = 100,
    defaultRegistersPerPage = 10,
    includeFilters = true,
    includeOrder = true,
    additionalResponses = [],
  } = options || {};

  const decorators = [
    ApiQuery({
      name: 'currentPage',
      required: false,
      description: 'Current page number (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'registersPerPage',
      required: false,
      description: `Number of registers per page (max: ${maxRegistersPerPage}, default: ${defaultRegistersPerPage})`,
      example: defaultRegistersPerPage,
    }),
    ApiResponse({
      status: 200,
      description: 'Successfully retrieved list.',
    }),
  ];

  if (includeOrder) {
    decorators.push(
      ApiQuery({
        name: 'order[columnName]',
        required: false,
        description: 'Column name to order by',
        example: 'name',
      }),
      ApiQuery({
        name: 'order[order]',
        required: false,
        description: 'Order direction',
        enum: ['asc', 'desc'],
        example: 'asc',
      }),
    );
  }

  if (includeFilters) {
    decorators.push(
      ApiQuery({
        name: 'filters',
        required: false,
        description:
          'JSON string with filters (e.g., {"name": "John", "state": "SP"})',
        example: '{}',
      }),
    );
  }

  // Add any additional responses
  additionalResponses.forEach((response) => {
    decorators.push(ApiResponse(response));
  });

  return applyDecorators(...decorators);
}
