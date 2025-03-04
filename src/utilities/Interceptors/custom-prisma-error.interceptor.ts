import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable, catchError } from 'rxjs';
import { PrismaErrorMap } from '../Decorators/prisma-error.decorator';

/**
 * Creates a custom interceptor for handling Prisma errors with custom messages
 */
export function createPrismaErrorInterceptor(errorMap: PrismaErrorMap) {
  return {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle().pipe(
        catchError((error) => {
          // Only handle Prisma known request errors
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            const errorCode = error.code;

            // Check if we have a custom handler for this error code
            if (errorMap[errorCode]) {
              const errorHandler = errorMap[errorCode];
              const customMessage: string =
                typeof errorHandler === 'function'
                  ? (
                      errorHandler as (
                        error: Prisma.PrismaClientKnownRequestError,
                      ) => string
                    )(error)
                  : errorHandler;

              // Attach the custom message to the error
              error.message = customMessage;
            }
          }

          // Re-throw the error to be caught by the global interceptor
          throw error;
        }),
      );
    },
  };
}
