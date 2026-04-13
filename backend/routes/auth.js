const express = require('express');
const prisma = require('../lib/prisma');
const { serializeUser } = require('../utils/serializers');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password harus diisi',
      });
    }

    const user = await prisma.user.findFirst({
      where: { username, password },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: serializeUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Auth endpoint ready',
  });
});

module.exports = router;
