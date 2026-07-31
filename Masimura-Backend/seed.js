const mongoose = require('mongoose');
require('dotenv').config();

const Menu = require('./models/Menu');
const Stock = require('./models/Stock');

const MONGO_URI = process.env.MONGO_URI;

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Terhubung ke MongoDB untuk seeding...');

    // 1. Bersihkan data lama jika ada
    await Menu.deleteMany({});
    await Stock.deleteMany({});

    // 2. Buat Data Stok Bahan Awal
    const stocks = await Stock.insertMany([
      { namaBahan: 'Daging Sapi', hargaBahan: 120000, stokAwal: 50, sisaStok: 50 },
      { namaBahan: 'Roti Burger', hargaBahan: 2000, stokAwal: 100, sisaStok: 100 },
      { namaBahan: 'Saus Spesial', hargaBahan: 15000, stokAwal: 20, sisaStok: 20 },
      { namaBahan: 'Kopi Espresso', hargaBahan: 85000, stokAwal: 30, sisaStok: 30 },
    ]);

    console.log('📦 Data Stok Bahan berhasil dibuat!');

    // 3. Buat Data Menu POS Masimura
    await Menu.insertMany([
      {
        namaMenu: 'East Side Special Burger',
        kategori: 'East Side',
        harga: 35000,
        gambar: '',
        resep: [
          { stockId: stocks[0]._id, namaBahan: 'Daging Sapi', kuantitas: 1 },
          { stockId: stocks[1]._id, namaBahan: 'Roti Burger', kuantitas: 1 },
          { stockId: stocks[2]._id, namaBahan: 'Saus Spesial', kuantitas: 1 }
        ]
      },
      {
        namaMenu: 'West Side Rice Bowl',
        kategori: 'West Side',
        harga: 30000,
        gambar: '',
        resep: [
          { stockId: stocks[0]._id, namaBahan: 'Daging Sapi', kuantitas: 1 }
        ]
      },
      {
        namaMenu: 'Masimura Iced Coffee',
        kategori: 'Drinks',
        harga: 18000,
        gambar: '',
        resep: [
          { stockId: stocks[3]._id, namaBahan: 'Kopi Espresso', kuantitas: 1 }
        ]
      }
    ]);

    console.log('🍔 Data Menu Masimura berhasil dibuat!');
    console.log('🎉 Seeding Selesai!');

  } catch (err) {
    console.error('❌ Gagal Seeding:', err);
  } finally {
    mongoose.connection.close();
  }
}

seedData();