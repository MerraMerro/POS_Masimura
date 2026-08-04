const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  nomorStruk: { type: String, required: true, unique: true },
  kasirId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Sangat bagus untuk melacak siapa yang shift
  namaKonsumen: { type: String, default: 'Pelanggan' },
  
  items: [{
    menuId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu' },
    namaMenu: String,
    harga: Number,
    kuantitas: Number,
    subtotal: Number,
    
    // ---> TAMBAHAN WAJIB UNTUK SISTEM STOK <---
    // Menyimpan resep saat menu dibeli agar pemotongan & pemulihan stok akurat
    resep: { type: Array, default: [] } 
  }],
  
  totalHarga: { type: Number, required: true },
  nominalBayar: { type: Number, required: true },
  kembalian: { type: Number, required: true },
  
  // ---> TAMBAHAN UNTUK METODE PEMBAYARAN <---
  metodePembayaran: { type: String, default: 'tunai' }, 
  
  statusTransaksi: { 
    type: String, 
    enum: ['In Process', 'Selesai', 'Diretur'], 
    default: 'Selesai' 
  },
  waktuTransaksi: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);