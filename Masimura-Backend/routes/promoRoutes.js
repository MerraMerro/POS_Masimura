const express = require('express');
const router = express.Router();
const Promo = require('../models/Promo'); // Pastikan Anda sudah membuat model Promo.js

// Get Semua Promo
router.get('/', async (req, res) => {
  try {
    // Mengambil semua promo, diurutkan dari yang terbaru
    const promos = await Promo.find().sort({ createdAt: -1 });
    res.json(promos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tambah Promo Baru
router.post('/', async (req, res) => {
  const { namaPromo, tipeDiskon, nilaiDiskon, menuTerpilih, status } = req.body;
  try {
    const newPromo = new Promo({
      namaPromo,
      tipeDiskon,
      nilaiDiskon,
      menuTerpilih,
      status
    });
    await newPromo.save();
    res.status(201).json(newPromo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update Data Promo
router.put('/:id', async (req, res) => {
  try {
    const updatedPromo = await Promo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedPromo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Hapus Promo (Tambahan wajib karena di React ada fitur hapus promo)
router.delete('/:id', async (req, res) => {
  try {
    const deletedPromo = await Promo.findByIdAndDelete(req.params.id);
    if (!deletedPromo) {
      return res.status(404).json({ message: 'Promo tidak ditemukan' });
    }
    res.json({ message: 'Promo berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;