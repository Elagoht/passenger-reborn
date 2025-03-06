import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTags() {
  if ((await prisma.tag.count()) > 0) return;

  const panicTagId = await prisma.tag.create({
    data: { name: 'Panic', color: '#FF0000', icon: 0 },
    select: { id: true },
  });

  await prisma.configuration.create({
    data: { key: 'panicTagId', value: panicTagId.id },
  });
}

void seedTags();
