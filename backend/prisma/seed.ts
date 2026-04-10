import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { auth } from '../src/auth/auth';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findFirst({
    where: { username: 'admin' },
    select: { id: true },
  });
  if (!existing) {
    await auth.api.signUpEmail({
      body: {
        email: 'admin@simpro.id',
        name: 'Administrator',
        password: 'Admin@123',
        username: 'admin',
        role: 'admin',
        status: 'active',
      },
    });
  }

  const defaults: [string, string][] = [
    ['system_name', 'SIMPRO'],
    ['currency', 'IDR'],
    ['currency_symbol', 'Rp'],
    ['timezone', 'Asia/Jakarta'],
    ['date_format', 'DD/MM/YYYY'],
    ['hourly_rate', '0'],
    ['tax_rate', '11'],
  ];
  for (const [key, value] of defaults) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: {},
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
