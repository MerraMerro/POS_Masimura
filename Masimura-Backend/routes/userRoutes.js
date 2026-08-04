const express = require('express');
const router = express.Router();
const User = require('../models/User');

// --- GET Semua User ---
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- UPDATE Profil / Akun User (Admin) ---
router.put('/profile/:id', async (req, res) => {
  try {
    const { username, password, nama } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    // Proteksi: Cegah mengubah akun Master / Default
    if (user.username === 'admin' || user.role === 'master') {
      return res.status(403).json({ message: 'Akun Master/Default bersifat terkunci dan tidak dapat diubah!' });
    }

    if (username) user.username = username;
    if (nama) user.nama = nama;
    if (password && password.trim() !== '') {
      user.password = password; 
    }

    await user.save();
    res.json({ message: 'Akun berhasil diperbarui!', user });

  } catch (err) {
    console.error('Error update profile:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;