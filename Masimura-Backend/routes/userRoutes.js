const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Sesuaikan dengan path model User Anda

// Get Semua User (Untuk ditampilkan di halaman Atur Akun)
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Profil Admin (Username & Password)
router.put('/profile/:id', async (req, res) => {
  try {
    const { username, password, namaLengkap } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    // Proteksi: Cegah jika mencoba mengubah akun Master
    if (user.role === 'Master Admin' || user.role === 'Master Kasir' || user.isMaster) {
      return res.status(403).json({ message: 'Akun Master bersifat terkunci dan tidak dapat diubah!' });
    }

    if (username) user.username = username;
    if (namaLengkap) user.namaLengkap = namaLengkap;
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