import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing plants first
  await prisma.plant.deleteMany({});
  
  const plants = [
    {
      name: 'Ольха',
      species: 'Alnus',
      description: 'Дерево семейства Березовые. Цветет ранней весной, вызывает аллергические реакции.',
      bloomStart: 'март',
      bloomEnd: 'апрель',
      allergenicity: 4
    },
    {
      name: 'Берёза',
      species: 'Betula',
      description: 'Широко распространенное дерево, один из основных источников пыльцы, вызывающей аллергию.',
      bloomStart: 'апрель',
      bloomEnd: 'май',
      allergenicity: 5
    },
    {
      name: 'Злаки',
      species: 'Poaceae',
      description: 'Семейство однодольных растений, включающее пшеницу, рожь и другие травы.',
      bloomStart: 'май',
      bloomEnd: 'июль',
      allergenicity: 4
    },
    {
      name: 'Сорняки',
      species: 'Various',
      description: 'Различные сорные растения, цветут в середине лета.',
      bloomStart: 'июнь',
      bloomEnd: 'июль',
      allergenicity: 3
    },
    {
      name: 'Полынь',
      species: 'Artemisia',
      description: 'Травянистое растение, производящее огромное количество пыльцы.',
      bloomStart: 'июль',
      bloomEnd: 'сентябрь',
      allergenicity: 5
    },
    {
      name: 'Амброзия',
      species: 'Ambrosia',
      description: 'Очень аллергенное растение, активно цветущее в конце лета и осенью.',
      bloomStart: 'август',
      bloomEnd: 'октябрь',
      allergenicity: 5
    }
  ];

  for (const plant of plants) {
    await prisma.plant.create({
      data: plant
    });
  }

  console.log('✅ Успешно добавлены растения');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при добавлении растений:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 