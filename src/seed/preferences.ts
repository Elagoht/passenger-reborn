import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seed = [
  { key: 'strictMode', value: 'false' },
  { key: 'wordlist', value: '' },
];

async function seedPreferences() {
  const preferences = await prisma.preference.findMany();
  if (preferences.length > 0) return;

  await prisma.preference.createMany({ data: seed });
}

void seedPreferences();
