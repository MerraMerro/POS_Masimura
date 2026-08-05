const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const Expense = require('../models/Expense');

// Get Semua Stok Bahan
router.get('/', async (req, res) => {
  try {
    const stocks = await Stock.find();
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tambah Stok Bahan Baru (Otomatis Catat Pengeluaran Modal Awal)
router.post('/', async (req, res) => {
  const { namaBahan, hargaBahan, stokAwal, satuan } = req.body;
  try {
    const newStock = new Stock({
      namaBahan,
      hargaBahan,
      stokAwal,
      sisaStok: stokAwal,
      satuan: satuan || 'Gram (gr)'
    });
    await newStock.save();

    // -- CATAT PENGELUARAN AWAL --
    const modalAwal = Number(hargaBahan) * Number(stokAwal);
    if (modalAwal > 0) {
      const newExpense = new Expense({
        kategori: 'Bahan Baku',
        deskripsi: `Belanja modal awal bahan: ${namaBahan}`,
        nominal: modalAwal
      });
      await newExpense.save();
    }

    res.status(201).json(newStock);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update Data Stok (Tanpa penambahan kuantitas/restock)
router.put('/:id', async (req, res) => {
  try {
    const updatedStock = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedStock);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Restock Bahan & Update Harga Modal Dinamis (Otomatis Catat Pengeluaran)
router.put('/restock/:id', async (req, res) => {
  try {
    const { jumlahMasuk, totalHargaBeli } = req.body;
    
    const stockItem = await Stock.findById(req.params.id);
    if (!stockItem) {
      return res.status(404).json({ message: 'Bahan baku tidak ditemukan' });
    }

    const qtyTambahan = Number(jumlahMasuk);
    const totalBayar = Number(totalHargaBeli);

    // Hitung harga satuan baru dari total bayar dibagi jumlah barang yang masuk
    const hargaModalSatuanBaru = qtyTambahan > 0 ? totalBayar / qtyTambahan : stockItem.hargaBahan;

    // Update sisa stok dan harga modal terbaru
    stockItem.sisaStok = Number(stockItem.sisaStok) + qtyTambahan;
    stockItem.hargaBahan = hargaModalSatuanBaru; 

    const updatedStock = await stockItem.save();

    // -- CATAT PENGELUARAN RESTOCK --
    if (totalBayar > 0) {
      const newExpense = new Expense({
        kategori: 'Bahan Baku',
        deskripsi: `Restock: ${stockItem.namaBahan} (+${qtyTambahan} ${stockItem.satuan})`,
        nominal: totalBayar
      });
      await newExpense.save();
    }

    res.json(updatedStock);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- HAPUS BAHAN BAKU ---
router.delete('/:id', async (req, res) => {
  try {
    const deletedStock = await Stock.findByIdAndDelete(req.params.id);
    if (!deletedStock) {
      return res.status(404).json({ message: 'Bahan baku tidak ditemukan' });
    }
    res.json({ message: 'Bahan baku berhasil dihapus secara permanen' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;