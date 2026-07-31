const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');

// Get Semua Stok Bahan
router.get('/', async (req, res) => {
  try {
    const stocks = await Stock.find();
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tambah Stok Bahan Baru
router.post('/', async (req, res) => {
  const { namaBahan, hargaBahan, stokAwal } = req.body;
  try {
    const newStock = new Stock({
      namaBahan,
      hargaBahan,
      stokAwal,
      sisaStok: stokAwal
    });
    await newStock.save();
    res.status(201).json(newStock);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update Data Stok
router.put('/:id', async (req, res) => {
  try {
    const updatedStock = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedStock);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;