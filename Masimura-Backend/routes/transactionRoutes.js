const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transactions');
const Menu = require('../models/Menu');
const Stock = require('../models/Stock');

// Get Semua Transaksi (Untuk Laporan)
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ waktuTransaksi: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Simpan Transaksi Baru + Potong Stok Bahan Baku Otomatis
router.post('/', async (req, res) => {
  try {
    const { nomorStruk, namaKonsumen, items, totalHarga, nominalBayar, kembalian, metodePembayaran } = req.body;

    const newTransaction = new Transaction({
      nomorStruk,
      namaKonsumen,
      items,
      totalHarga,
      nominalBayar,
      kembalian,
      metodePembayaran: metodePembayaran || 'Tunai', 
      statusTransaksi: 'Selesai'
    });

    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (!item.menuId) continue;
        const menuData = await Menu.findById(item.menuId);
        
        if (menuData && menuData.resep) {
          for (const resepItem of menuData.resep) {
            const totalTerpakai = resepItem.kuantitas * (item.kuantitas || 1);

            await Stock.findByIdAndUpdate(resepItem.stockId, {
              $inc: { 
                stokTerpakai: totalTerpakai,
                sisaStok: -totalTerpakai 
              }
            });
          }
        }
      }
    }

    await newTransaction.save();
    res.status(201).json({ message: 'Transaksi berhasil & stok ter-update!', transaction: newTransaction });

  } catch (err) {
    console.error('Error transaksi:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update Transaksi (Edit Status & Metode Pembayaran)
router.put('/:id', async (req, res) => {
  try {
    const { statusTransaksi, metodePembayaran } = req.body;
    
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          statusTransaksi: statusTransaksi,
          metodePembayaran: metodePembayaran
        } 
      },
      { new: true } 
    );

    if (!updatedTransaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }

    res.json({ message: 'Data transaksi berhasil diperbarui!', transaction: updatedTransaction });
  } catch (err) {
    console.error('Error update transaksi:', err);
    res.status(400).json({ message: err.message });
  }
});

// Hapus Transaksi & Kembalikan (Restorasi) Stok Bahan Baku
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }

    // Restorasi Stok Bahan Baku
    if (transaction.items && Array.isArray(transaction.items)) {
      for (const item of transaction.items) {
        if (!item.menuId) continue;
        const menuData = await Menu.findById(item.menuId);
        
        if (menuData && menuData.resep) {
          for (const resepItem of menuData.resep) {
            const totalDikembalikan = resepItem.kuantitas * (item.kuantitas || 1);

            await Stock.findByIdAndUpdate(resepItem.stockId, {
              $inc: { 
                stokTerpakai: -totalDikembalikan,
                sisaStok: totalDikembalikan 
              }
            });
          }
        }
      }
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaksi berhasil dihapus dan stok bahan baku telah dipulihkan!' });

  } catch (err) {
    console.error('Error saat menghapus transaksi:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;