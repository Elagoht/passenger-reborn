import { NestFactory } from '@nestjs/core';
import { PrismaErrorInterceptor } from './interceptors/prisma-error.interceptor';
import validationPipe from './pipes/validation';
import { AppModule } from './resources/app.module';
import { Environment } from './utilities/Environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(validationPipe);
  app.useGlobalInterceptors(new PrismaErrorInterceptor());

  // Only initialize Swagger in development
  if (Environment.NODE_ENV !== 'production') {
    await import('./utilities/Swagger')
      .then(({ createSwaggerConfig }) => createSwaggerConfig(app))
      .catch((error) => console.warn('Failed to load Swagger:', error));
  }

  await app.listen(Environment.PORT);
}

void bootstrap();
