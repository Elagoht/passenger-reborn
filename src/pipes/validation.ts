import { ValidationPipe } from '@nestjs/common';

const validationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: false,
  transformOptions: {
    enableImplicitConversion: true,
  },
});

export default validationPipe;
