import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import Environment from './utilities/Environment';
import { PrismaErrorInterceptor } from './utilities/Interceptors/prisma-error.interceptor';
import validationPipe from './utilities/Pipes/validation';
import { createSwaggerConfig } from './utilities/Swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(validationPipe);
  app.useGlobalInterceptors(new PrismaErrorInterceptor());

  createSwaggerConfig(app);

  await app.listen(Environment.PORT);
}

void bootstrap();
