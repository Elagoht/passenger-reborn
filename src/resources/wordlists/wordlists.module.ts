import { Module } from '@nestjs/common';
import { GitModule } from 'src/utilities/Git/git.module';
import { WordListsController } from './wordlists.controller';
import { WordListsService } from './wordlists.service';

@Module({
  imports: [GitModule],
  controllers: [WordListsController],
  providers: [WordListsService],
})
export class WordListsModule {}
