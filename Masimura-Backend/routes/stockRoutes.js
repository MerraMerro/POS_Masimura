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

router.put('/restock/:id', async (req, res) => {
  try {
    const { jumlahMasuk, totalHargaBeli } = req.body;
    
    const stockItem = await Stock.findById(req.params.id);
    if (!stockItem) {
      return res.status(404).json({ message: 'Bahan baku tidak ditemukan' });
    }

    const qtyTambahan = Number(jumlahMasuk);
    const totalBayar = Number(totalHargaBeli);

    // Hitung harga satuan baru dari total bayar dibagi jumlah barang yang masuk (sudah termasuk potongan supplier)
    const hargaModalSatuanBaru = qtyTambahan > 0 ? totalBayar / qtyTambahan : stockItem.hargaBahan;

    // Update sisa stok dan harga modal terbaru
    stockItem.sisaStok = Number(stockItem.sisaStok) + qtyTambahan;
    stockItem.hargaBahan = hargaModalSatuanBaru; // Harga modal diperbarui ke harga beli terakhir

    const updatedStock = await stockItem.save();
    res.json(updatedStock);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;