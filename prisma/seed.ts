import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPreferences() {
  const preferences = await prisma.preference.findMany();
  if (preferences.length > 0) return;

  await prisma.preference.createMany({
    data: [
      { key: 'strictMode', value: 'false' },
      { key: 'wordlist', value: '' },
    ],
  });
}

async function seedWordlists() {
  const wordlists = await prisma.wordlist.findMany();
  if (wordlists.length > 0) return;

  await prisma.wordlist.createMany({
    data: [
      {
        displayName: 'RockYou 2009',
        slug: 'rockyou-2009',
        year: 2009,
        source: 'https://github.com/zacheller/rockyou',
        repository:
          'https://github.com/Elagoht/passenger-wordlist-rockyou-2009',
        description: 'The most popular passwords from RockYou 2009',
        publishedBy: 'Zacheller',
        adaptedBy: 'Elagoht',
        minLength: 8,
        maxLength: 285,
        totalFiles: 203,
        totalPasswords: 14000000,
        size: 104.5,
        sizeUnits: 'MB',
      },
    ],
  });
}

void seedPreferences();
void seedWordlists();
