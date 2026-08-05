const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

// Mengambil semua data pengeluaran
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ tanggal: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Anda bisa menambahkan route POST di sini nanti jika ingin ada fitur input pengeluaran operasional manual (misal: bayar listrik/wifi)

module.exports = router;