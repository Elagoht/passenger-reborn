import { Module } from '@nestjs/common';
import { AuthModule } from './resources/auth/auth.module';
import { PassphrasesModule } from './resources/passphrases/passphrases.module';
import { PrismaModule } from './utilities/Prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule, PassphrasesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
