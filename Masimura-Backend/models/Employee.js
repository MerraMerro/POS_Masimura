const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  namaKaryawan: { type: String, required: true },
  jabatan: { type: String, required: true }, // e.g., 'Kasir', 'Admin', 'Koki', 'Pelayan'
  gajiPokok: { type: Number, required: true },
  status: { type: String, default: 'Aktif' }, // 'Aktif' atau 'Nonaktif'
  tanggalMasuk: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);