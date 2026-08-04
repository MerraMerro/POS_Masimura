import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, Layers, X } from 'lucide-react'
import { API_URL } from '../../../config/api'

export default function CategoryManagement() {
  const [categories, setCategories] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formData, setFormData] = useState({
    namaKategori: '',
    deskripsi: ''
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`)
      const data = await res.json()
      setCategories(data)
    } catch (err) {
      console.error('Gagal mengambil data kategori:', err)
    }
  }

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingId(category._id)
      setFormData({
        namaKategori: category.namaKategori,
        deskripsi: category.deskripsi || ''
      })
    } else {
      setEditingId(null)
      setFormData({
        namaKategori: '',
        deskripsi: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const url = editingId
      ? `${API_URL}/api/categories/${editingId}`
      : `${API_URL}/api/categories`
    const method = editingId ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        fetchCategories()
        setIsModalOpen(false)
      } else {
        const errJson = await res.json()
        alert(errJson.message || 'Gagal menyimpan kategori')
      }
    } catch (err) {
      console.error('Gagal menyimpan kategori:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return
    try {
      const res = await fetch(`${API_URL}/api/categories/${id}`, { method: 'DELETE' })
      if (res.ok) fetchCategories()
    } catch (err) {
      console.error('Gagal menghapus kategori:', err)
    }
  }

  const filteredCategories = categories.filter(cat =>
    cat.namaKategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.deskripsi.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
            Kelola Kategori Menu
          </h3>
          <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            Daftar pengelompokan hidangan dan minuman Masimura POS
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:opacity-95 transition-all text-xs sm:text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-3 sm:p-4 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabel Kategori */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {/* min-w-[500px] memaksa tabel tetap rapi dan bisa discroll jika di layar HP sangat sempit */}
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Nama Kategori</th>
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Deskripsi</th>
                <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-xs sm:text-sm text-slate-500">Tidak ada kategori ditemukan.</td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat._id} className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center border border-blue-200/50 dark:border-blue-700/50 text-blue-600 dark:text-blue-400 shrink-0">
                          <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                          {cat.namaKategori}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      {cat.deskripsi || '-'}
                    </td>
                    <td className="p-3 sm:p-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5 sm:space-x-2">
                        <button
                          onClick={() => handleOpenModal(cat)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                          title="Edit Kategori"
                        >
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat._id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2 sm:pb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400">Nama Kategori</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Dessert, Snack, Beverages"
                  value={formData.namaKategori}
                  onChange={(e) => setFormData({ ...formData, namaKategori: e.target.value })}
                  className="w-full mt-1 p-2 sm:p-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400">Deskripsi</label>
                <textarea
                  rows="3"
                  placeholder="Penjelasan singkat kategori..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full mt-1 p-2 sm:p-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="pt-3 sm:pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}