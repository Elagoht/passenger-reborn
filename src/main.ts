import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import Environment from './utilities/Environment';
import validationPipe from './utilities/Pipes/validation';
import { createSwaggerConfig } from './utilities/Swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(validationPipe);

  createSwaggerConfig(app);

  await app.listen(Environment.PORT);
}

bootstrap();
