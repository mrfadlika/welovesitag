const express = require('express');
const db = require('../data/db');

const router = express.Router();

/**
 * POST /api/auth/login
 * User login endpoint
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username dan password harus diisi',
    });
  }

  // Find user
  const user = db.users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Username atau password salah',
    });
  }

  // Remove password from response
  const { password: _, ...userData } = user;

  return res.status(200).json({
    success: true,
    message: 'Login berhasil',
    data: userData,
  });
});

/**
 * GET /api/auth/me
 * Get current user info (can be used with JWT later)
 */
router.get('/me', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Auth endpoint ready',
  });
});

module.exports = router;
