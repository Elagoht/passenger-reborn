import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable, catchError } from 'rxjs';

@Injectable()
export class PrismaErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          switch (error.code) {
            // Not found
            case 'P2001': // Record does not exist
            case 'P2015': // Record not found
            case 'P2025': // Record not found (findUniqueOrThrow, findFirstOrThrow)
              throw new NotFoundException(
                error.meta?.cause || 'Resource not found',
              );

            // Unique constraint violations
            case 'P2002':
              throw new ConflictException(
                `Unique constraint failed on field: ${
                  (error.meta?.target as string[])?.join(', ') || 'unknown'
                }`,
              );

            // Foreign key constraint failures
            case 'P2003': {
              const fieldName =
                typeof error.meta?.field_name === 'object'
                  ? 'unknown'
                  : (error.meta?.field_name ?? 'unknown');
              throw new BadRequestException(
                `Foreign key constraint failed on field: ${fieldName as string}`,
              );
            }

            // Required field constraint failures
            case 'P2011': {
              const constraint =
                typeof error.meta?.constraint === 'object'
                  ? 'unknown'
                  : (error.meta?.constraint ?? 'unknown');
              throw new BadRequestException(
                `Null constraint violation on field: ${constraint as string}`,
              );
            }

            // Invalid data
            case 'P2007': // Invalid data
            case 'P2012': // Missing required value
            case 'P2013': // Missing required argument
            case 'P2014': // Relation violation
            case 'P2019': // Input error
              throw new BadRequestException(
                error.message || 'Invalid data provided',
              );

            // Query engine errors
            case 'P2020': // Value out of range for the type
            case 'P2021': // Table/model does not exist
            case 'P2022': // Column/field does not exist
            case 'P2023': // Inconsistent column data
              throw new BadRequestException(
                error.message || 'Database schema error',
              );

            // Transaction errors
            case 'P2028': // Transaction API error
            case 'P2029': // Transaction timeout
            case 'P2030': // Transaction failed
            case 'P2031': // Transaction already started
              throw new InternalServerErrorException(
                'Database transaction error',
              );

            // Connection errors
            case 'P2024': // Connection timed out
            case 'P2026': // Connection limit reached
            case 'P2027': // Connection already open
              throw new InternalServerErrorException(
                'Database connection error',
              );

            default:
              throw new InternalServerErrorException(
                'An unexpected database error occurred',
              );
          }
        }

        if (error instanceof Prisma.PrismaClientValidationError) {
          throw new BadRequestException(
            'Validation error: Invalid data provided',
          );
        }

        if (error instanceof Prisma.PrismaClientRustPanicError) {
          throw new InternalServerErrorException(
            'Critical database error occurred',
          );
        }

        if (error instanceof Prisma.PrismaClientInitializationError) {
          throw new InternalServerErrorException(
            'Failed to initialize database connection',
          );
        }

        throw error;
      }),
    );
  }
}
