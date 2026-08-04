import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, Tags, X, Tag } from 'lucide-react'
import { API_URL } from '../../../config/api'

export default function PromoManagement() {
  const [promos, setPromos] = useState([])
  const [menus, setMenus] = useState([]) // Untuk daftar pilihan menu
  const [searchTerm, setSearchTerm] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const [formData, setFormData] = useState({
    namaPromo: '',
    tipeDiskon: 'Persentase', // 'Persentase' atau 'Nominal'
    nilaiDiskon: '',
    menuTerpilih: [], // Array berisi ID menu yang didiskon
    status: 'Aktif'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Ambil data promo dan menu sekaligus
      const [resPromos, resMenus] = await Promise.all([
        fetch(`${API_URL}/api/promos`).catch(() => ({ json: () => [] })), // Asumsi endpoint API
        fetch(`${API_URL}/api/menus`)
      ])
      
      const promosData = resPromos.ok ? await resPromos.json() : []
      const menusData = resMenus.ok ? await resMenus.json() : []
      
      setPromos(promosData)
      setMenus(menusData)
    } catch (err) {
      console.error('Gagal mengambil data:', err)
    }
  }

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setEditingId(promo._id)
      setFormData({
        namaPromo: promo.namaPromo,
        tipeDiskon: promo.tipeDiskon || 'Persentase',
        nilaiDiskon: promo.nilaiDiskon,
        menuTerpilih: promo.menuTerpilih || [],
        status: promo.status || 'Aktif'
      })
    } else {
      setEditingId(null)
      setFormData({
        namaPromo: '',
        tipeDiskon: 'Persentase',
        nilaiDiskon: '',
        menuTerpilih: [],
        status: 'Aktif'
      })
    }
    setIsModalOpen(true)
  }

  const handleCheckboxChange = (menuId) => {
    setFormData((prev) => {
      const isSelected = prev.menuTerpilih.includes(menuId)
      if (isSelected) {
        // Hapus dari array jika sudah ada (uncheck)
        return { ...prev, menuTerpilih: prev.menuTerpilih.filter(id => id !== menuId) }
      } else {
        // Tambahkan ke array jika belum ada (check)
        return { ...prev, menuTerpilih: [...prev.menuTerpilih, menuId] }
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.menuTerpilih.length === 0) {
      alert('Pilih minimal satu menu untuk promo ini!')
      return
    }

    setIsProcessing(true)
    const url = editingId ? `${API_URL}/api/promos/${editingId}` : `${API_URL}/api/promos`
    const method = editingId ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        fetchData()
        setIsModalOpen(false)
      } else {
        alert('Gagal menyimpan promo')
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus promo ini secara permanen?')) return
    try {
      const res = await fetch(`${API_URL}/api/promos/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch (err) {
      console.error('Gagal menghapus promo:', err)
    }
  }

  const filteredPromos = promos.filter(p => 
    p.namaPromo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Tags className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            Kelola Promo & Diskon
          </h3>
          <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Atur potongan harga untuk menu tertentu agar pelanggan makin tertarik!
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:opacity-95 transition-all text-xs sm:text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Promo</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-3 sm:p-4 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama promo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabel Promo */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Nama Promo</th>
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Besaran Diskon</th>
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Target Menu</th>
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Status</th>
                <th className="text-center p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-xs sm:text-sm text-slate-500">Belum ada promo aktif.</td>
                </tr>
              ) : (
                filteredPromos.map((promo) => (
                  <tr key={promo._id} className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                          <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                          {promo.namaPromo}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {promo.tipeDiskon === 'Persentase' ? `${promo.nilaiDiskon}%` : `Rp ${promo.nilaiDiskon.toLocaleString('id-ID')}`}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                        {promo.menuTerpilih?.length || 0} Menu Terpilih
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className={`px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-full ${
                        promo.status === 'Aktif' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {promo.status}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5 sm:space-x-2">
                        <button onClick={() => handleOpenModal(promo)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button onClick={() => handleDelete(promo._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-colors">
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-4 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3 mb-3 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                {editingId ? 'Edit Promo' : 'Buat Promo Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-3 sm:space-y-4">
              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400">Nama Promo</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Diskon Ramadhan, Paket Hemat"
                  value={formData.namaPromo}
                  onChange={(e) => setFormData({ ...formData, namaPromo: e.target.value })}
                  className="w-full mt-1 p-2 sm:p-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400">Tipe Diskon</label>
                  <select
                    value={formData.tipeDiskon}
                    onChange={(e) => setFormData({ ...formData, tipeDiskon: e.target.value })}
                    className="w-full mt-1 p-2 sm:p-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                  >
                    <option value="Persentase">Persentase (%)</option>
                    <option value="Nominal">Nominal (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400">Nilai Potongan</label>
                  <input
                    type="number"
                    required
                    placeholder={formData.tipeDiskon === 'Persentase' ? "Misal: 15" : "Misal: 5000"}
                    value={formData.nilaiDiskon}
                    onChange={(e) => setFormData({ ...formData, nilaiDiskon: e.target.value ? Number(e.target.value) : '' })}
                    className="w-full mt-1 p-2 sm:p-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Pemilihan Menu (Checkbox List) */}
              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Pilih Menu yang Didiskon</label>
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 h-32 sm:h-40 overflow-y-auto space-y-1">
                  {menus.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Memuat daftar menu...</p>
                  ) : (
                    menus.map(menu => (
                      <label key={menu._id} className="flex items-center space-x-2 p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 rounded focus:ring-blue-500"
                          checked={formData.menuTerpilih.includes(menu._id)}
                          onChange={() => handleCheckboxChange(menu._id)}
                        />
                        <span className="text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">
                          {menu.namaMenu} <span className="text-slate-400 font-normal">(Rp {menu.harga?.toLocaleString('id-ID')})</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400">Status Promo</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      value="Aktif"
                      checked={formData.status === 'Aktif'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">Aktif</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      value="Nonaktif"
                      checked={formData.status === 'Nonaktif'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 focus:ring-slate-500"
                    />
                    <span className="text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-300">Nonaktif</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-slate-200 dark:border-slate-700 mt-4 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {isProcessing ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}