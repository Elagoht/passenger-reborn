import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { RateLimiterGuard } from './guards/rate-limiter.guard';
import { PrismaErrorInterceptor } from './interceptors/prisma-error.interceptor';
import validationPipe from './pipes/validation';
import { AppModule } from './resources/app.module';
import { Environment } from './utilities/Environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: [
      'Content-Type',
      'Origin',
      'X-Requested-With',
      'Accept',
      'Authorization',
    ],
    exposedHeaders: ['Authorization'],
    credentials: true,
  });
  app.useGlobalGuards(new RateLimiterGuard());
  app.useGlobalPipes(validationPipe);
  app.useGlobalInterceptors(new PrismaErrorInterceptor());

  // Only initialize Swagger in development
  if (Environment.NODE_ENV !== 'production') {
    await import('./utilities/Swagger')
      .then(({ createSwaggerConfig }) => createSwaggerConfig(app))
      .catch((error) => Logger.warn('Failed to load Swagger:', error));
  }

  await app.listen(Environment.PORT);
}

void bootstrap();
