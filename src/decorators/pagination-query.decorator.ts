import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { DEFAULT_PAGE, DEFAULT_TAKE, MAX_TAKE } from './pagination.decorator';

/**
 * Decorator that adds standard pagination query parameters to Swagger documentation
 */
export function ApiPaginationQuery() {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: `Page number (starts from 1). Default: ${DEFAULT_PAGE}`,
      example: DEFAULT_PAGE,
    }),
    ApiQuery({
      name: 'take',
      required: false,
      type: Number,
      description: `Number of items per page (max: ${MAX_TAKE}). Default: ${DEFAULT_TAKE}`,
      example: DEFAULT_TAKE,
    }),
  );
}
