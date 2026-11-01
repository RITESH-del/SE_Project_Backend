import bcrypt from 'bcrypt';
import prisma from '../db.js';

async function main() {
  const saltRounds = 10;
  const users = [
    {
      name: 'System Administrator',
      email: 'admin@campus.edu',
      password: await bcrypt.hash('admin123', saltRounds),
      role: 'admin',
    },
    {
      name: 'Professor John Doe',
      email: 'faculty@campus.edu',
      password: await bcrypt.hash('faculty123', saltRounds),
      role: 'faculty',
    },
    {
      name: 'Alice Smith',
      email: 'student@campus.edu',
      password: await bcrypt.hash('student123', saltRounds),
      role: 'student',
    },
  ];

  console.log('Seeding demo users...');
  for (const user of users) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!existing) {
      const created = await prisma.user.create({ data: user });
      console.log(`Created ${created.role} user: ${created.email}`);
    } else {
      console.log(`User already exists: ${user.email}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
