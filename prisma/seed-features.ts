import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MAX_SHOPS feature...');

  // 1. Upsert Feature "MAX_SHOPS"
  const maxShopsFeature = await prisma.feature.upsert({
    where: { feature_code: 'MAX_SHOPS' },
    update: {
      description: 'Maximum number of shops a tenant can create',
      is_active: true,
    },
    create: {
      feature_code: 'MAX_SHOPS',
      description: 'Maximum number of shops a tenant can create',
      is_active: true,
    },
  });

  console.log(`Upserted Feature: ${maxShopsFeature.feature_code}`);

  // 2. Fetch all subscriptions we care about
  const packages = ['BASIC_MONTHLY', 'BASIC_YEARLY', 'ULTIMATE_MONTHLY', 'ULTIMATE_YEARLY'];
  const subscriptions = await prisma.subscription.findMany({
    where: {
      package_code: {
        in: packages,
      },
    },
  });

  if (subscriptions.length === 0) {
    console.log('No subscriptions found to map features to. Make sure packages are seeded before.');
    return;
  }

  // 3. Map subscriptions to MAX_SHOPS feature with corresponding limits
  for (const sub of subscriptions) {
    let limitValue = 1;
    if (sub.package_code.includes('ULTIMATE')) {
      limitValue = 2;
    }

    await prisma.subscriptionFeature.upsert({
      where: {
        subscription_id_feature_id: {
          subscription_id: sub.id,
          feature_id: maxShopsFeature.id,
        },
      },
      update: {
        limit_value: limitValue,
      },
      create: {
        subscription_id: sub.id,
        feature_id: maxShopsFeature.id,
        limit_value: limitValue,
      },
    });

    console.log(`Mapped MAX_SHOPS limit ${limitValue} to ${sub.package_code}`);
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
