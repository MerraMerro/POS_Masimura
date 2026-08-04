const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  namaMenu: { type: String, required: true },
  kategori: { type: String, required: true },
  harga: { type: Number, required: true },
  gambar: { type: String, default: '' },
  
  // Array resep untuk menghubungkan menu dengan bahan baku
  resep: [{
    stockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock' },
    namaBahan: { type: String, required: true },
    
    // ---> TAMBAHKAN BARIS INI <---
    satuan: { type: String, default: 'Pcs' }, 
    
    kuantitas: { type: Number, required: true }
  }],
  
  tanggalInput: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Menu', menuSchema);