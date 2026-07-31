const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  namaMenu: { type: String, required: true },
  kategori: { type: String, required: true }, // 'East Side', 'West Side', 'Drinks'
  harga: { type: Number, required: true },
  gambar: { type: String, default: '' },
  resep: [{
    stockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock' },
    namaBahan: String,
    kuantitas: Number // Jumlah bahan terpakai per porsi
  }]
}, { timestamps: true });

module.exports = mongoose.model('Menu', menuSchema);