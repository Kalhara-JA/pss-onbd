import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('AdminPassword123', 10);
  await prisma.contributor.upsert({
    where: { email: 'admin@pss.com' },
    update: {},
    create: {
      email: 'admin@pss.com',
      name: 'Platform Admin',
      password: hashed,
      role: 'Admin',
      status: 'approved',
      bankAccount: '', // or encrypted empty
    },
  });
}
main();
