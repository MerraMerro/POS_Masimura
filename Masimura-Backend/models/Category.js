const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema({
    namaKategori: {
        type: String,
        required: true,
        unique: true,
    },
    deskripsi: {
        type: String,
        default: ''
    }
}, { timestamps: true })

module.exports = mongoose.model('Category', CategorySchema)