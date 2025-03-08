import { Module } from '@nestjs/common';
import { CryptoModule } from 'src/utilities/Crypto/crypto.module';
import { GraphCacheModule } from 'src/utilities/GraphCache/graph-cache.module';
import { MemCacheModule } from 'src/utilities/MemCache/memcache.module';
import { PrismaModule } from 'src/utilities/Prisma/prisma.module';
import { AccountsModule } from './accounts/accounts.module';
import { AnalysesModule } from './analyses/analyses.module';
import { AuthModule } from './auth/auth.module';
import { CollectionsModule } from './collections/collections.module';
import { GenerateModule } from './generate/generate.module';
import { LeaksModule } from './leaks/leaks.module';
import { PanicModule } from './panic/panic.module';
import { PreferencesModule } from './preferences/preferences.module';
import { StatsModule } from './stats/stats.module';
import { TagsModule } from './tags/tags.module';
import { WordListsModule } from './wordlists/wordlists.module';

@Module({
  imports: [
    AnalysesModule,
    AuthModule,
    AccountsModule,
    CollectionsModule,
    CryptoModule,
    GenerateModule,
    GraphCacheModule,
    LeaksModule,
    MemCacheModule,
    PanicModule,
    PreferencesModule,
    PrismaModule,
    StatsModule,
    TagsModule,
    WordListsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
