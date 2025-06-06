import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const DEFAULT_PAGE = 1;
export const DEFAULT_TAKE = 12; // Divisible by 1, 2, 3, 4, 6, 12
export const MAX_TAKE = 120;

export const Pagination = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): PaginationParams => {
    const request: Request = ctx.switchToHttp().getRequest();

    // Extract page and take from query parameters
    let page = parseInt(request.query.page as string) || DEFAULT_PAGE;
    let take = parseInt(request.query.take as string) || DEFAULT_TAKE;

    // Ensure page is a positive integer
    if (page < 1) {
      page = DEFAULT_PAGE;
    }

    // Ensure take doesn't exceed maximum
    if (take > MAX_TAKE) {
      take = MAX_TAKE;
    }

    return { page, take };
  },
);
