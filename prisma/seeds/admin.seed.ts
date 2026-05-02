import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedAdmin(prisma: PrismaClient) {
  const managerEmail = 'manager@gmail.com';
  const staffEmail = 'staff@gmail.com';

  const password = await bcrypt.hash('password', 10);

  const existingManager = await prisma.admin.findUnique({
    where: { email: managerEmail },
  });

  // ❗ Nếu đã có manager → skip toàn bộ
  if (existingManager) {
    console.log('Manager already exists, skip seeding');
    return;
  }

  await prisma.$transaction(async (tx) => {
    const manager = await tx.admin.create({
      data: {
        email: managerEmail,
        password,
        full_name: 'Admin Manager',
        manager_id: null,
      },
    });

    await tx.admin.create({
      data: {
        email: staffEmail,
        password,
        full_name: 'Staff Admin',
        manager_id: manager.id,
      },
    });
  });

  console.log('Admin hierarchy seeded');
}