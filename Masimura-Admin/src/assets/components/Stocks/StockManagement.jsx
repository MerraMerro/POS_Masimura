import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit2, 
  Search, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Trash2, 
  PlusCircle 
} from 'lucide-react'

export default function StockManagement() {
  const [stocks, setStocks] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('Semua')
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false)
  const [restockData, setRestockData] = useState({ id: null, namaBahan: '', currentStok: 0, addAmount: '' })

  // Form State Utama (Add/Edit)
  const [formData, setFormData] = useState({
    namaBahan: '',
    hargaBahan: '',
    sisaStok: ''
  })

  useEffect(() => {
    fetchStocks()
  }, [])

  const fetchStocks = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/stocks')
      const data = await res.json()
      setStocks(data)
    } catch (err) {
      console.error('Gagal mengambil data stok:', err)
    }
  }

  // --- FUNGSI MODAL TAMBAH & EDIT ---
  const handleOpenModal = (stock = null) => {
    if (stock) {
      setEditingId(stock._id)
      setFormData({
        namaBahan: stock.namaBahan,
        hargaBahan: stock.hargaBahan,
        sisaStok: stock.sisaStok
      })
    } else {
      setEditingId(null)
      setFormData({
        namaBahan: '',
        hargaBahan: '',
        sisaStok: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const url = editingId 
      ? `http://localhost:5000/api/stocks/${editingId}`
      : 'http://localhost:5000/api/stocks'
    const method = editingId ? 'PUT' : 'POST'

    // Jika membuat bahan baru, kirim sisaStok (serta stokAwal dummy agar tidak error di DB lama)
    const payload = editingId 
      ? {
          namaBahan: formData.namaBahan,
          hargaBahan: formData.hargaBahan,
          sisaStok: formData.sisaStok
        }
      : { 
          ...formData, 
          stokAwal: formData.sisaStok,
          stokTerpakai: 0 
        }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        fetchStocks()
        setIsModalOpen(false)
      }
    } catch (err) {
      console.error('Gagal menyimpan stok:', err)
    }
  }

  // --- FUNGSI RESTOCK (TAMBAH STOK CEPAT) ---
  const handleOpenRestock = (stock) => {
    setRestockData({
      id: stock._id,
      namaBahan: stock.namaBahan,
      currentStok: stock.sisaStok,
      addAmount: ''
    })
    setIsRestockModalOpen(true)
  }

  const handleRestockSubmit = async (e) => {
    e.preventDefault()
    const newStok = Number(restockData.currentStok) + Number(restockData.addAmount)
    
    try {
      const res = await fetch(`http://localhost:5000/api/stocks/${restockData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sisaStok: newStok }) // Hanya update sisa stoknya
      })

      if (res.ok) {
        fetchStocks()
        setIsRestockModalOpen(false)
      }
    } catch (err) {
      console.error('Gagal menambah stok:', err)
    }
  }

  // --- FUNGSI HAPUS BAHAN ---
  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus ${nama} secara permanen?`)) return

    try {
      const res = await fetch(`http://localhost:5000/api/stocks/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) fetchStocks()
    } catch (err) {
      console.error('Gagal menghapus bahan:', err)
    }
  }

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch = stock.namaBahan.toLowerCase().includes(searchTerm.toLowerCase())
    const isLow = stock.sisaStok <= 5
    
    if (selectedStatus === 'Aman') return matchesSearch && !isLow
    if (selectedStatus === 'Menipis') return matchesSearch && isLow
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            Kelola Stok Bahan Baku
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Inventaris Bahan Dapur dan Pemantauan Sisa Stok Mingguan
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:opacity-95 transition-all text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Bahan Baku</span>
        </button>
      </div>

      {/* Filter & Search Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama bahan baku..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {['Semua', 'Aman', 'Menipis'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedStatus === status
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Stok Bahan Baku */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Nama Bahan</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Harga Modal</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Stok Tersedia</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Status</th>
                <th className="text-center p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock) => {
                const isLow = stock.sisaStok <= 5
                return (
                  <tr key={stock._id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800 dark:text-white">
                          {stock.namaBahan}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        Rp {stock.hargaBahan?.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-base font-black ${isLow ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {stock.sisaStok}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-bold rounded-full ${
                        isLow 
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' 
                          : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isLow ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{isLow ? 'Stok Menipis' : 'Stok Aman'}</span>
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Tombol Restock */}
                        <button
                          onClick={() => handleOpenRestock(stock)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                          title="Tambah Stok (Restock)"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        
                        {/* Tombol Edit */}
                        <button
                          onClick={() => handleOpenModal(stock)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                          title="Edit Info Bahan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        {/* Tombol Hapus */}
                        <button
                          onClick={() => handleDelete(stock._id, stock.namaBahan)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                          title="Hapus Bahan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL TAMBAH/EDIT BAHAN ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {editingId ? 'Edit Info Bahan' : 'Tambah Bahan Baku Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nama Bahan Baku</label>
                <input
                  type="text"
                  required
                  value={formData.namaBahan}
                  onChange={(e) => setFormData({ ...formData, namaBahan: e.target.value })}
                  className="w-full mt-1 p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Harga Modal (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formData.hargaBahan}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ 
                          ...formData, 
                          hargaBahan: val === '' ? '' : Number(val) 
                      });
                    }}
                    className="w-full mt-1 p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {editingId ? 'Sisa Stok Saat Ini' : 'Stok Awal'}
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.sisaStok}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ 
                          ...formData, 
                          sisaStok: val === '' ? '' : Number(val) 
                      });
                    }}
                    className="w-full mt-1 p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL RESTOCK KHUSUS ================= */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-500" />
                Restock Bahan
              </h3>
              <button onClick={() => setIsRestockModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Menambah stok untuk <span className="font-bold text-slate-800 dark:text-white">{restockData.namaBahan}</span>.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Stok saat ini: <span className="font-bold">{restockData.currentStok}</span>
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Jumlah Masuk (Ditambahkan)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 50"
                  value={restockData.addAmount}
                  onChange={(e) => setRestockData({ ...restockData, addAmount: e.target.value })}
                  className="w-full mt-1 p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}