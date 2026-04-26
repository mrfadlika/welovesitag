const express = require('express');
const prisma = require('../lib/prisma');
const { serializeUser } = require('../utils/serializers');

const router = express.Router();

const VALID_ROLES = ['admin', 'staff_pos', 'checker'];

// GET /api/users — daftar semua pengguna
router.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        email: true,
        pitArea: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    return next(error);
  }
});

// POST /api/users — buat pengguna baru
router.post('/', async (req, res, next) => {
  try {
    const { username, password, name, role, email, pitArea } = req.body;

    // Validasi field wajib
    if (!username || !password || !name || !role || !email) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, nama, role, dan email wajib diisi',
      });
    }

    // Validasi role
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role tidak valid. Pilih salah satu: ${VALID_ROLES.join(', ')}`,
      });
    }

    // Cek username sudah ada
    const existingUsername = await prisma.user.findFirst({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: `Username "${username}" sudah digunakan`,
      });
    }

    // Cek email sudah ada
    const existingEmail = await prisma.user.findFirst({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: `Email "${email}" sudah terdaftar`,
      });
    }

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        password: password.trim(),
        name: name.trim(),
        role,
        email: email.trim().toLowerCase(),
        pitArea: pitArea?.trim() || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: `Pengguna "${name}" berhasil dibuat`,
      data: serializeUser(newUser),
    });
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/users/:id — hapus pengguna
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    await prisma.user.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: `Pengguna "${user.name}" berhasil dihapus`,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
