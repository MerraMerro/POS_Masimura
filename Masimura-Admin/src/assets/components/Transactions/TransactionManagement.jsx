import React, { useState, useEffect } from 'react'
import { CreditCard, Search, Calendar, FileText, ArrowLeftRight, Edit2, X } from 'lucide-react'

export default function TransactionManagement() {
  const [transactions, setTransactions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('Semua')

  // --- State Modal Edit ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    statusTransaksi: 'Selesai',
    metodePembayaran: 'Tunai'
  })

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/transactions')
      const data = await res.json()
      // Mengurutkan transaksi dari yang paling baru
      const sortedData = data.sort((a, b) => new Date(b.waktuTransaksi || b.createdAt) - new Date(a.waktuTransaksi || a.createdAt))
      setTransactions(sortedData)
    } catch (err) {
      console.error('Gagal mengambil data transaksi:', err)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Selesai':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'In Process':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'Diretur':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    }
  }

  // --- LOGIKA MODAL ---
  const handleOpenModal = (trx) => {
    setEditingId(trx._id)
    setFormData({
      statusTransaksi: trx.statusTransaksi || 'Selesai',
      metodePembayaran: trx.metodePembayaran || 'Tunai'
    })
    setIsModalOpen(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      const res = await fetch(`http://localhost:5000/api/transactions/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        fetchTransactions()
        setIsModalOpen(false)
      } else {
        alert('Gagal memperbarui data transaksi')
      }
    } catch (error) {
      console.error('Error saat update:', error)
      alert('Terjadi kesalahan koneksi')
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredTransactions = transactions.filter((trx) => {
    const matchesSearch =
      (trx.nomorStruk || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trx.namaKonsumen || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'Semua' || trx.statusTransaksi === selectedStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
          Kelola Transaksi Penjualan
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Riwayat Nota Belanja, Log Pembayaran, dan Status Pemesanan
        </p>
      </div>

      {/* Filter & Search Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari No Struk atau Konsumen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['Semua', 'Selesai', 'In Process', 'Diretur'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
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

      {/* Tabel Riwayat Transaksi */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30">
              <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">No Struk</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Konsumen</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Total Biaya</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Bayar / Kembali</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Metode</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Waktu</th>
                <th className="text-center p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">Tidak ada data transaksi.</td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr key={trx._id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {trx.nomorStruk}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-semibold text-slate-800 dark:text-white">
                        {trx.namaKonsumen || 'Pelanggan'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        Rp {trx.totalHarga?.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-xs space-y-0.5">
                        <p className="text-slate-500 dark:text-slate-400">Bayar: Rp {trx.nominalBayar?.toLocaleString('id-ID')}</p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium">Kembali: Rp {trx.kembalian?.toLocaleString('id-ID')}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {trx.metodePembayaran || 'Tunai'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${getStatusBadge(trx.statusTransaksi)}`}>
                        {trx.statusTransaksi || 'Selesai'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {new Date(trx.waktuTransaksi || trx.createdAt).toLocaleString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleOpenModal(trx)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                        title="Edit Transaksi"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL EDIT TRANSAKSI ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm shadow-2xl overflow-hidden">
            
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 p-5 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-500" />
                Edit Transaksi
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              {/* Pilihan Metode Pembayaran */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Metode Pembayaran</label>
                <select
                  value={formData.metodePembayaran}
                  onChange={(e) => setFormData({ ...formData, metodePembayaran: e.target.value })}
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                >
                  <option value="Tunai">Tunai</option>
                  <option value="QRIS">QRIS</option>
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="Kartu Debit/Kredit">Kartu Debit/Kredit</option>
                </select>
              </div>

              {/* Pilihan Status Transaksi */}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Status Pesanan</label>
                <select
                  value={formData.statusTransaksi}
                  onChange={(e) => setFormData({ ...formData, statusTransaksi: e.target.value })}
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                >
                  <option value="Selesai">Selesai</option>
                  <option value="In Process">In Process</option>
                  <option value="Diretur">Diretur</option>
                </select>
              </div>

              {/* Tombol Simpan */}
              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-200 dark:border-slate-700 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2 text-sm bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}