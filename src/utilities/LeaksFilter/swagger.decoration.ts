import { applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiPaginationQuery } from 'src/decorators/pagination-query.decorator';
import {
  LeakFilterDto,
  SortField,
  SortOrder,
} from 'src/resources/leaks/schemas/requests/filter';
import ResponseLeakResults from 'src/resources/leaks/schemas/responses/results';

export const ApiLeaksFilter = () => {
  return applyDecorators(
    ApiPaginationQuery(),
    ApiExtraModels(LeakFilterDto, ResponseLeakResults),
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
      type: Number,
    }),
    ApiQuery({
      name: 'pwnCountTo',
      required: false,
      description: 'Filter by maximum affected accounts',
      type: Number,
    }),
    ApiQuery({
      name: 'verified',
      required: false,
      description: 'Filter by verification status',
      type: Boolean,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: SortField,
      description: 'Sort fields',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: SortOrder,
      description: 'Sort order',
    }),
    ApiResponse({
      status: 200,
      description: 'Returns filtered and paginated data breaches',
      schema: {
        allOf: [{ $ref: getSchemaPath(ResponseLeakResults) }],
      },
    }),
  );
};
