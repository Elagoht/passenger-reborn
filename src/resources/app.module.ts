import { Module } from '@nestjs/common';
import { CryptoModule } from 'src/utilities/Crypto/crypto.module';
import { GraphCacheModule } from 'src/utilities/GraphCache/graph-cache.module';
import { MemCacheModule } from 'src/utilities/MemCache/memcache.module';
import { PrismaModule } from 'src/utilities/Prisma/prisma.module';
import { AccountsModule } from './accounts/accounts.module';
import { AnalysesModule } from './analyses/analyses.module';
import { AuthModule } from './auth/auth.module';
import { GenerateModule } from './generate/generate.module';
import { LeaksModule } from './leaks/leaks.module';
import { PreferencesModule } from './preferences/preferences.module';
import { StatsModule } from './stats/stats.module';
import { TagsModule } from './tags/tags.module';
import { TransferModule } from './transfer/transfer.module';
import { WordListsModule } from './wordlists/wordlists.module';

@Module({
  imports: [
    AccountsModule,
    AnalysesModule,
    AuthModule,
    CryptoModule,
    GenerateModule,
    GraphCacheModule,
    LeaksModule,
    MemCacheModule,
    PreferencesModule,
    PrismaModule,
    StatsModule,
    TagsModule,
    TransferModule,
    WordListsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
