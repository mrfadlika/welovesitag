const prisma = require('../lib/prisma');

const DEFAULT_USERS = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'Ahmad Rizki',
    role: 'admin',
    email: 'admin@sitag.co.id',
    avatar: null,
    pitArea: null,
  },
  {
    username: 'staffpos',
    password: 'staff123',
    name: 'Budi Santoso',
    role: 'staff_pos',
    email: 'budi@sitag.co.id',
    avatar: null,
    pitArea: null,
  },
  {
    username: 'checker',
    password: 'checker123',
    name: 'Dedi Kurniawan',
    role: 'checker',
    email: 'dedi@sitag.co.id',
    avatar: null,
    pitArea: 'Pit 3 - Blok B',
  },
];

async function bootstrapDefaultUsers() {
  const usersCount = await prisma.user.count();

  if (usersCount > 0) {
    console.log(`[BOOTSTRAP] Skip default users bootstrap: ${usersCount} user(s) already exist.`);
    return;
  }

  await prisma.$transaction(
    DEFAULT_USERS.map((user) =>
      prisma.user.create({
        data: user,
      }),
    ),
  );

  console.log(`[BOOTSTRAP] Inserted ${DEFAULT_USERS.length} default user(s) because database was empty.`);
}

module.exports = {
  bootstrapDefaultUsers,
};
