import { Module } from '@nestjs/common';
import { AccountsModule } from './resources/accounts/accounts.module';
import { AuthModule } from './resources/auth/auth.module';
import { PrismaModule } from './utilities/Prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule, AccountsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
