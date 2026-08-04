const mongoose = require('mongoose');

const promoSchema = new mongoose.Schema({
  namaPromo: {
    type: String,
    required: true
  },
  tipeDiskon: {
    type: String,
    enum: ['Persentase', 'Nominal'],
    default: 'Persentase'
  },
  nilaiDiskon: {
    type: Number,
    required: true
  },
  menuTerpilih: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu' // Sesuaikan dengan nama model Menu Anda
  }],
  status: {
    type: String,
    enum: ['Aktif', 'Nonaktif'],
    default: 'Aktif'
  }
}, { timestamps: true });

module.exports = mongoose.model('Promo', promoSchema);