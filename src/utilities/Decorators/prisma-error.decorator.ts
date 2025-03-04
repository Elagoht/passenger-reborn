import { UseInterceptors, applyDecorators } from '@nestjs/common';
import { createPrismaErrorInterceptor } from '../Interceptors/custom-prisma-error.interceptor';

/**
 * Decorator for handling Prisma errors with custom messages
 *
 * @example
 * @PrismaErrors({
 *   P2002: "Custom unique constraint message",
 *   P2025: (error) => `Record not found: ${error.meta?.cause || 'unknown'}`
 * })
 */
export function PrismaErrors(errorMap: PrismaErrorMap) {
  return applyDecorators(
    UseInterceptors(createPrismaErrorInterceptor(errorMap)),
  );
}
