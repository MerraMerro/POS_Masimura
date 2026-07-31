import React, { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Search, Trash2, X, Image as ImageIcon, PlusCircle } from 'lucide-react'

export default function MenuManagement() {
  const [menus, setMenus] = useState([])
  const [categories, setCategories] = useState([])
  const [stocks, setStocks] = useState([]) // Data bahan baku untuk dropdown resep
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Semua')
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const fileInputRef = useRef(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  // Form State Utama
  const [formData, setFormData] = useState({
    namaMenu: '',
    kategori: '',
    harga: '',
    gambar: '', // URL gambar
    resep: [] // Array bahan baku: { stockId, namaBahan, kuantitas }
  })

  // State Sementara untuk Form Resep
  const [tempBahanId, setTempBahanId] = useState('')
  const [tempKuantitas, setTempKuantitas] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [resMenus, resCat, resStocks] = await Promise.all([
        fetch('http://localhost:5000/api/menus'),
        fetch('http://localhost:5000/api/categories'),
        fetch('http://localhost:5000/api/stocks')
      ])
      
      setMenus(await resMenus.json())
      setCategories(await resCat.json())
      setStocks(await resStocks.json())
    } catch (err) {
      console.error('Gagal mengambil data:', err)
    }
  }

  // --- LOGIKA MODAL & FORM ---
  const handleOpenModal = (menu = null) => {
    if (menu) {
      setEditingId(menu._id)
      setFormData({
        namaMenu: menu.namaMenu,
        kategori: menu.kategori || (categories[0]?.namaKategori || ''),
        harga: menu.harga,
        gambar: menu.gambar || '',
        resep: menu.resep || []
      })
      setImagePreview(menu.gambar || null)
    } else {
      setEditingId(null)
      setFormData({
        namaMenu: '',
        kategori: categories[0]?.namaKategori || '',
        harga: '',
        gambar: '',
        resep: []
      })
      setImagePreview(null)
    }
    setSelectedFile(null)
    setTempBahanId('')
    setTempKuantitas('')
    setIsModalOpen(true)
  }

  // --- LOGIKA UPLOAD GAMBAR ---
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // --- LOGIKA TAMBAH/HAPUS RESEP (BAHAN BAKU) ---
  const handleAddResep = () => {
    if (!tempBahanId || !tempKuantitas) return alert('Pilih bahan dan masukkan kuantitas!')
    
    // Cari nama bahan dari daftar stocks berdasarkan ID
    const selectedStock = stocks.find(s => s._id === tempBahanId)
    if (!selectedStock) return

    // Cek apakah bahan sudah ada di resep, jika ada, update kuantitasnya saja
    const existingIndex = formData.resep.findIndex(r => r.stockId === tempBahanId)
    let newResep = [...formData.resep]
    
    if (existingIndex >= 0) {
      newResep[existingIndex].kuantitas = Number(newResep[existingIndex].kuantitas) + Number(tempKuantitas)
    } else {
      newResep.push({
        stockId: tempBahanId,
        namaBahan: selectedStock.namaBahan,
        kuantitas: Number(tempKuantitas)
      })
    }

    setFormData({ ...formData, resep: newResep })
    setTempBahanId('')
    setTempKuantitas('')
  }

  const handleRemoveResep = (indexToRemove) => {
    const newResep = formData.resep.filter((_, idx) => idx !== indexToRemove)
    setFormData({ ...formData, resep: newResep })
  }

  // --- LOGIKA SUBMIT DATA ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      let imageUrl = formData.gambar

      // 1. Jika ada file gambar baru yang dipilih, upload dulu!
      if (selectedFile) {
        const imageFormData = new FormData()
        imageFormData.append('gambar', selectedFile)

        const uploadRes = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          body: imageFormData
        })
        const uploadData = await uploadRes.json()
        if (uploadRes.ok) {
          imageUrl = uploadData.imageUrl
        } else {
          alert('Gagal mengupload gambar')
          setIsProcessing(false)
          return
        }
      }

      // 2. Simpan Data Menu (beserta Resep dan URL Gambar)
      const payload = {
        ...formData,
        gambar: imageUrl
      }

      const url = editingId 
        ? `http://localhost:5000/api/menus/${editingId}`
        : 'http://localhost:5000/api/menus'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        fetchData()
        setIsModalOpen(false)
      } else {
        const errorData = await res.json()
        alert(errorData.message || 'Gagal menyimpan menu')
      }
    } catch (err) {
      console.error('Error saat submit:', err)
      alert('Terjadi kesalahan koneksi')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus menu ${nama}?`)) return
    try {
      const res = await fetch(`http://localhost:5000/api/menus/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch (err) {
      console.error('Gagal menghapus menu:', err)
    }
  }

  // --- FILTER ---
  const filteredMenus = menus.filter((menu) => {
    const matchesSearch = menu.namaMenu?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategoryFilter === 'Semua' || menu.kategori === selectedCategoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Kelola Menu Produk</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Daftar Katalog Hidangan Masimura POS</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:opacity-95 transition-all text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategoryFilter('Semua')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategoryFilter === 'Semua' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategoryFilter(cat.namaKategori)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategoryFilter === cat.namaKategori ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              }`}
            >
              {cat.namaKategori}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Produk</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Kategori</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Harga</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Bahan Resep</th>
                <th className="text-center p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredMenus.map((menu) => (
                <tr key={menu._id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
                        <img 
                          src={menu.gambar || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'} 
                          alt={menu.namaMenu} 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100' }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{menu.namaMenu}</p>
                        <p className="text-[10px] text-slate-400">{menu.kategori}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-semibold">
                      {menu.kategori}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      Rp {menu.harga?.toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {menu.resep?.length || 0} bahan terhubung
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={() => handleOpenModal(menu)} className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(menu._id, menu.namaMenu)} className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL TAMBAH/EDIT MENU ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 p-5 shrink-0">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {editingId ? 'Edit Menu Produk' : 'Tambah Menu Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 overflow-y-auto space-y-4">
              
              {/* Nama Menu */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Nama Menu</label>
                <input
                  type="text"
                  required
                  value={formData.namaMenu}
                  onChange={(e) => setFormData({ ...formData, namaMenu: e.target.value })}
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              {/* Upload Gambar */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Pilih Foto Produk</label>
                <div className="flex items-center space-x-4 mt-1">
                  {imagePreview ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 shrink-0 text-slate-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden" 
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Pilih File
                    </button>
                    <p className="text-[10px] text-slate-400 mt-1">Format: JPG, PNG (Max 2MB)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Kategori */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Kategori</label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                  >
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.namaKategori}>{cat.namaKategori}</option>
                    ))}
                  </select>
                </div>
                {/* Harga */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formData.harga}
                    onChange={(e) => setFormData({ ...formData, harga: Number(e.target.value) })}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* ===== SECTION RESEP (BAHAN BAKU) ===== */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="text-sm font-bold text-slate-800 dark:text-white mb-3 block border-b border-slate-200 dark:border-slate-700 pb-2">
                  Bahan Resep
                </label>
                
                {/* Form Tambah Resep */}
                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <select
                      value={tempBahanId}
                      onChange={(e) => setTempBahanId(e.target.value)}
                      className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                    >
                      <option value="">Pilih Bahan Baku...</option>
                      {stocks.map(s => (
                        <option key={s._id} value={s._id}>{s.namaBahan}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={tempKuantitas}
                      onChange={(e) => setTempKuantitas(e.target.value)}
                      className="w-full p-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddResep}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                    title="Tambah Bahan ke Resep"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>

                {/* List Resep Terpilih */}
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {formData.resep.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2 italic">Belum ada bahan resep yang ditambahkan.</p>
                  ) : (
                    formData.resep.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {item.namaBahan}
                        </span>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Qty: {item.kuantitas}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveResep(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-5 flex justify-end space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="px-6 py-2 text-sm bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Menyimpan...' : 'Simpan Menu'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}