import { applyDecorators } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PaginationQuery } from 'src/decorators/pagination-query.decorator';

export const ApiLeaksFilter = () => {
  return applyDecorators(
    PaginationQuery(),
    ApiQuery({
      name: 'name',
      required: false,
      description: 'Filter by breach name (fuzzy search)',
    }),
    ApiQuery({
      name: 'title',
      required: false,
      description: 'Filter by breach title (fuzzy search)',
    }),
    ApiQuery({
      name: 'domain',
      required: false,
      description: 'Filter by breach domain (fuzzy search)',
    }),
    ApiQuery({
      name: 'date',
      required: false,
      description: 'Filter by breach date (from)',
      type: Date,
    }),
    ApiQuery({
      name: 'dateTo',
      required: false,
      description: 'Filter by breach date (to)',
      type: Date,
    }),
    ApiQuery({
      name: 'pwnCount',
      required: false,
      description: 'Filter by minimum affected accounts',
      type: 'number',
    }),
    ApiQuery({
      name: 'pwnCountTo',
      required: false,
      description: 'Filter by maximum affected accounts',
      type: 'number',
    }),
    ApiQuery({
      name: 'verified',
      required: false,
      description: 'Filter by verification status',
      type: 'boolean',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['name', 'title', 'domain', 'date', 'pwnCount', 'verified'],
      description: 'Sort fields',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['asc', 'desc'],
      description: 'Sort order',
    }),
    ApiResponse({
      status: 200,
      description: 'Returns filtered and paginated data breaches',
    }),
  );
};
