import { WordListsService } from 'src/resources/wordlists/wordlists.service';
import { GitService } from 'src/utilities/Git/git.service';
import { PrismaService } from 'src/utilities/Prisma/prisma.service';

const prismaService = new PrismaService();

const wordlistService = new WordListsService(prismaService, new GitService());

const wordListsToSeed = [
  'https://raw.githubusercontent.com/Elagoht/passenger-wordlist-rockyou-2009/refs/heads/main/metadata.json',
];

async function seedWordlists() {
  const wordlists = await wordlistService.getWordLists();

  if (wordlists.length > 0) {
    console.log('Wordlists already seeded');
    return;
  }

  for (const wordlist of wordListsToSeed) {
    await wordlistService.importWordList(wordlist);
  }
}

void seedWordlists();
