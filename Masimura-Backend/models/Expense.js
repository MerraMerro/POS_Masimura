const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  kategori: { 
    type: String, 
    required: true,
    enum: ['Bahan Baku', 'Gaji Karyawan', 'Operasional', 'Lainnya'],
    default: 'Bahan Baku'
  },
  deskripsi: { type: String, required: true },
  nominal: { type: Number, required: true },
  tanggal: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);