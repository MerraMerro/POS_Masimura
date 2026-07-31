const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  namaBahan: { type: String, required: true },
  hargaBahan: { type: Number, required: true },
  stokAwal: { type: Number, required: true },
  stokTerpakai: { type: Number, default: 0 },
  sisaStok: { type: Number, required: true },
  tanggalInput: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);