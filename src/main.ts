import { NestFactory } from '@nestjs/core';
import { PrismaErrorInterceptor } from './interceptors/prisma-error.interceptor';
import validationPipe from './pipes/validation';
import { AppModule } from './resources/app.module';
import Environment from './utilities/Environment';
import { createSwaggerConfig } from './utilities/Swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(validationPipe);
  app.useGlobalInterceptors(new PrismaErrorInterceptor());

  createSwaggerConfig(app);

  await app.listen(Environment.PORT);
}

void bootstrap();
