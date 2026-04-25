async function seedUsers() {
  const users = [
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

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: { username: user.username },
      update: { ...user, password: hashedPassword },
      create: { ...user, password: hashedPassword },
    });
  }
}
