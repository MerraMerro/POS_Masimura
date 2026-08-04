const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transactions'); 
const Stock = require('../models/Stock');
const Menu = require('../models/Menu');

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
      metodePembayaran: metodePembayaran || 'tunai', 
      statusTransaksi: 'Selesai'
    });

    // Proses Pemotongan Stok Langsung dari resep yang dikirim Frontend
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.resep && Array.isArray(item.resep)) {
          for (const resepItem of item.resep) {
            const totalTerpakai = Number(resepItem.kuantitas) * Number(item.kuantitas || 1);

            // Kita cari bahan baku berdasarkan ID atau Nama (fleksibel)
            const query = resepItem.stockId ? { _id: resepItem.stockId } : { namaBahan: resepItem.namaBahan };

            await Stock.findOneAndUpdate(query, {
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

    // Restorasi Stok Bahan Baku menggunakan resep historis yang tersimpan di struk
    if (transaction.items && Array.isArray(transaction.items)) {
      for (const item of transaction.items) {
        if (item.resep && Array.isArray(item.resep)) {
          for (const resepItem of item.resep) {
            const totalDikembalikan = Number(resepItem.kuantitas) * Number(item.kuantitas || 1);

            const query = resepItem.stockId ? { _id: resepItem.stockId } : { namaBahan: resepItem.namaBahan };

            await Stock.findOneAndUpdate(query, {
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
    res.json({ message: 'Transaksi berhasil dihapus dan stok bahan baku telah dipulihkan secara akurat!' });

  } catch (err) {
    console.error('Error saat menghapus transaksi:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================================================
// FITUR EKSPOR CSV (SESUAI LAPORAN MANUAL KLIEN)
// ==========================================================

// Bantuan untuk mengetahui jumlah hari dalam suatu bulan
const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();

// A. EKSPOR REKAP MENU (BARIS = TANGGAL, KOLOM = MENU, DIBAGI MAKANAN & MINUMAN)
router.get('/export/rekap-menu', async (req, res) => {
  try {
    const date = new Date();
    const month = parseInt(req.query.month) || date.getMonth() + 1;
    const year = parseInt(req.query.year) || date.getFullYear();
    const daysInMonth = getDaysInMonth(month, year);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Tarik Transaksi
    const transactions = await Transaction.find({
      statusTransaksi: 'Selesai',
      waktuTransaksi: { $gte: startDate, $lte: endDate }
    });

    // Tarik Menu untuk mengetahui Kategori (Makanan atau Minuman)
    const menus = await Menu.find();
    const kamusKategori = {};
    menus.forEach(m => {
      kamusKategori[m.namaMenu] = m.kategori ? m.kategori.toLowerCase() : 'makanan';
    });

    // Siapkan wadah data matriks
    // Struktur: dailyData[jenis][tanggal][namaMenu] = kuantitas
    const dailyData = { makanan: {}, minuman: {} };
    const menuSet = { makanan: new Set(), minuman: new Set() };

    for (let i = 1; i <= daysInMonth; i++) {
      dailyData.makanan[i] = {};
      dailyData.minuman[i] = {};
    }

    transactions.forEach(trx => {
      const trxDate = new Date(trx.waktuTransaksi || trx.createdAt);
      const day = trxDate.getDate();

      if (Array.isArray(trx.items)) {
        trx.items.forEach(item => {
          const menuName = item.namaMenu.replace(/,/g, ''); // Hapus koma
          const kategori = kamusKategori[item.namaMenu] || 'makanan';
          
          // Pisahkan berdasarkan kategori (Jika ada kata 'drink' atau 'minum', masuk Minuman)
          const isMinuman = kategori.includes('drink') || kategori.includes('minum');
          const jenis = isMinuman ? 'minuman' : 'makanan';

          menuSet[jenis].add(menuName); // Daftarkan nama menu sebagai Kolom
          
          if (!dailyData[jenis][day][menuName]) {
            dailyData[jenis][day][menuName] = 0;
          }
          dailyData[jenis][day][menuName] += (Number(item.kuantitas) || 1);
        });
      }
    });

    const arrMakanan = Array.from(menuSet.makanan);
    const arrMinuman = Array.from(menuSet.minuman);

    // Fungsi pembuat string tabel CSV
    const generateTableString = (title, arrMenu, dataHarian) => {
      // 1. Header Kolom
      let csv = `${title}\nTanggal,`;
      arrMenu.forEach(m => csv += `${m},`);
      csv += `TOTAL PORSI HARIAN\n`;

      let totalPerMenu = {};
      arrMenu.forEach(m => totalPerMenu[m] = 0);
      let grandTotal = 0;

      // 2. Baris Data (Tanggal 1 s/d 31)
      for (let i = 1; i <= daysInMonth; i++) {
        let row = `='${i}/${month}',`;
        let rowTotal = 0;
        
        arrMenu.forEach(m => {
          const qty = dataHarian[i][m] || 0; // Tulis 0 jika tidak ada
          row += `${qty},`;
          rowTotal += qty;
          totalPerMenu[m] += qty;
        });
        
        row += `${rowTotal}\n`;
        csv += row;
        grandTotal += rowTotal;
      }

      // 3. Baris Paling Bawah (TOTAL BULANAN PER MENU)
      let lastRow = `TOTAL KESELURUHAN,`;
      arrMenu.forEach(m => {
         lastRow += `${totalPerMenu[m]},`;
      });
      lastRow += `${grandTotal}\n\n\n`; // Jarak kosong sebelum tabel berikutnya

      return csv;
    };

    // Gabungkan tabel Makanan dan Minuman
    let finalCsv = generateTableString('=== LAPORAN PENJUALAN MAKANAN ===', arrMakanan, dailyData.makanan);
    finalCsv += generateTableString('=== LAPORAN PENJUALAN MINUMAN ===', arrMinuman, dailyData.minuman);

    // Kirim File ke Frontend
    res.header('Content-Type', 'text/csv');
    res.attachment(`Rekap_Menu_${month}_${year}.csv`);
    return res.send(finalCsv);

  } catch (err) {
    console.error('Export Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// B. EKSPOR REKAP HARIAN KEUANGAN
router.get('/export/rekap-harian', async (req, res) => {
  try {
    const date = new Date();
    const month = parseInt(req.query.month) || date.getMonth() + 1;
    const year = parseInt(req.query.year) || date.getFullYear();
    const daysInMonth = getDaysInMonth(month, year);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      statusTransaksi: 'Selesai',
      waktuTransaksi: { $gte: startDate, $lte: endDate }
    });

    // Siapkan data per tanggal
    const dailyData = {};
    for (let i = 1; i <= daysInMonth; i++) {
      dailyData[i] = { porsi: 0, customer: 0, pemasukan: 0 };
    }

    transactions.forEach(trx => {
      const trxDate = new Date(trx.waktuTransaksi || trx.createdAt);
      const day = trxDate.getDate();

      dailyData[day].customer += 1;
      dailyData[day].pemasukan += Number(trx.totalHarga) || 0;

      if (Array.isArray(trx.items)) {
        trx.items.forEach(item => {
          dailyData[day].porsi += Number(item.kuantitas) || 1;
        });
      }
    });

    // Pembuatan Header (Pengeluaran dibuat dummy kosong karena di sistem belum ada fitur catat pengeluaran)
    let csvString = `Tanggal,Jumlah Porsi,Jumlah Customer,Jumlah Pemasukan,Jumlah Pengeluaran\n`;
    
    let totPorsi = 0, totCustomer = 0, totPemasukan = 0;
    
    // Pengisian Baris Data
    for (let i = 1; i <= daysInMonth; i++) {
      csvString += `${i}/${month}/${year},${dailyData[i].porsi},${dailyData[i].customer},${dailyData[i].pemasukan},0\n`;
      totPorsi += dailyData[i].porsi;
      totCustomer += dailyData[i].customer;
      totPemasukan += dailyData[i].pemasukan;
    }
    
    csvString += `TOTAL,${totPorsi},${totCustomer},${totPemasukan},0\n`;

    res.header('Content-Type', 'text/csv');
    res.attachment(`Rekap_Harian_Keuangan_${month}_${year}.csv`);
    return res.send(csvString);

  } catch (err) {
    console.error('Export Error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;