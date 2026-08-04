import React, { useState, useEffect } from 'react'
import { CreditCard, Search, Calendar, FileText, ArrowLeftRight, Edit2, Trash2, X, Eye, Printer } from 'lucide-react'
import { API_URL } from '../../../config/api'

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

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  const handleOpenDetail = (trx) => {
    setSelectedTransaction(trx)
    setIsDetailModalOpen(true)
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/transactions`)
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
      const res = await fetch(`${API_URL}/api/transactions/${editingId}`, {
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

  // --- LOGIKA HAPUS TRANSAKSI ---
  const handleDelete = async (id, nomorStruk) => {
    if (!window.confirm(`Yakin ingin menghapus transaksi ${nomorStruk}? Stok bahan baku yang terkait akan dipulihkan.`)) {
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/transactions/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchTransactions()
      } else {
        const errorData = await res.json()
        alert(errorData.message || 'Gagal menghapus transaksi')
      }
    } catch (err) {
      console.error('Error saat menghapus:', err)
      alert('Terjadi kesalahan koneksi')
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
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
          Kelola Transaksi Penjualan
        </h3>
        <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
          Riwayat Nota Belanja, Log Pembayaran, dan Status Pemesanan
        </p>
      </div>

      {/* Filter & Search Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-sm">
        <div className="relative w-full sm:w-80 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari No Struk atau Konsumen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['Semua', 'Selesai', 'In Process', 'Diretur'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap ${
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
          {/* min-w-[800px] memaksa tabel tetap lebar di layar HP dan bisa di-scroll horizontal */}
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50/50 dark:bg-slate-800/30">
              <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">No Struk</th>
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Konsumen</th>
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Total Biaya</th>
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Bayar / Kembali</th>
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Metode</th>
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Status</th>
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Waktu</th>
                <th className="text-center p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-xs sm:text-sm text-slate-500">Tidak ada data transaksi.</td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr key={trx._id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 sm:p-4">
                      <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
                        {trx.nomorStruk}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white">
                        {trx.namaKonsumen || 'Pelanggan'}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        Rp {trx.totalHarga?.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="text-[11px] sm:text-xs space-y-0.5">
                        <p className="text-slate-500 dark:text-slate-400">Bayar: Rp {trx.nominalBayar?.toLocaleString('id-ID')}</p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium">Kembali: Rp {trx.kembalian?.toLocaleString('id-ID')}</p>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                        {trx.metodePembayaran || 'Tunai'}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className={`text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold ${getStatusBadge(trx.statusTransaksi)}`}>
                        {trx.statusTransaksi || 'Selesai'}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
                        {new Date(trx.waktuTransaksi || trx.createdAt).toLocaleString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5 sm:space-x-2">
                        {/* Tombol Detail */}
                        <button 
                          onClick={() => handleOpenDetail(trx)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                          title="Lihat Detail & Cetak Struk"
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        {/* Tombol Edit */}
                        <button 
                          onClick={() => handleOpenModal(trx)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                          title="Edit Transaksi"
                        >
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        {/* Tombol Hapus */}
                        <button 
                          onClick={() => handleDelete(trx._id, trx.nomorStruk)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                          title="Hapus Transaksi"
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

      {/* ================= MODAL EDIT TRANSAKSI ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm shadow-2xl overflow-hidden">
            
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                Edit Transaksi
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-4 sm:p-5 space-y-3 sm:space-y-4">
              {/* Pilihan Metode Pembayaran */}
              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Metode Pembayaran</label>
                <select
                  value={formData.metodePembayaran}
                  onChange={(e) => setFormData({ ...formData, metodePembayaran: e.target.value })}
                  className="w-full p-2 sm:p-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                >
                  <option value="Tunai">Tunai</option>
                  <option value="QRIS">QRIS</option>
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="Kartu Debit/Kredit">Kartu Debit/Kredit</option>
                </select>
              </div>

              {/* Pilihan Status Transaksi */}
              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Status Pesanan</label>
                <select
                  value={formData.statusTransaksi}
                  onChange={(e) => setFormData({ ...formData, statusTransaksi: e.target.value })}
                  className="w-full p-2 sm:p-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                >
                  <option value="Selesai">Selesai</option>
                  <option value="In Process">In Process</option>
                  <option value="Diretur">Diretur</option>
                </select>
              </div>

              {/* Tombol Simpan */}
              <div className="pt-3 sm:pt-4 flex justify-end space-x-2 sm:space-x-3 border-t border-slate-200 dark:border-slate-700 mt-4 sm:mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 sm:px-6 py-2 text-xs sm:text-sm bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* ================= MODAL DETAIL / CETAK STRUK ================= */}
      {isDetailModalOpen && selectedTransaction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 no-print"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Area Struk (Bisa dicetak) */}
            <div id="nota-cetak" className="pt-2">
              <div className="text-center border-b pb-3 border-slate-200 border-dashed mb-3">
                <h3 className="text-xl font-extrabold tracking-wider text-slate-900">MASIMURA POS</h3>
                <p className="text-xs text-slate-500 mt-0.5">Bukti Pembayaran Konsumen</p>
                <div className="text-[11px] text-slate-500 mt-2 space-y-1 text-left bg-slate-50 p-2 rounded-lg">
                  <p className="flex justify-between"><span>No. Struk:</span> <span className="font-bold text-slate-800">{selectedTransaction.nomorStruk}</span></p>
                  <p className="flex justify-between"><span>Konsumen:</span> <span className="font-bold text-slate-800">{selectedTransaction.namaKonsumen}</span></p>
                  <p className="flex justify-between"><span>Metode:</span> <span className="font-bold text-slate-800 capitalize">{selectedTransaction.metodePembayaran || 'Tunai'}</span></p>
                  <p className="flex justify-between"><span>Waktu:</span> <span className="font-bold text-slate-800">
                    {new Date(selectedTransaction.waktuTransaksi || selectedTransaction.createdAt).toLocaleString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span></p>
                </div>
              </div>

              <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                {selectedTransaction.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800">{item.namaMenu}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{item.kuantitas} x Rp {item.harga?.toLocaleString('id-ID')}</p>
                    </div>
                    <span className="font-bold text-slate-800 pt-0.5">
                      Rp {(item.harga * item.kuantitas).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-3 mt-3 text-xs space-y-1.5">
                <div className="flex justify-between font-extrabold text-sm text-slate-900">
                  <span>Total Harga:</span>
                  <span>Rp {selectedTransaction.totalHarga?.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Nominal Bayar:</span>
                  <span>Rp {selectedTransaction.nominalBayar?.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Kembalian:</span>
                  <span>Rp {selectedTransaction.kembalian?.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
            
            {/* Tombol Aksi Modal */}
            <div className="pt-3 flex gap-2 no-print border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Nota</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Khusus untuk Print */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #nota-cetak, #nota-cetak * { visibility: visible; }
          #nota-cetak { position: absolute; left: 0; top: 0; width: 100%; padding: 10mm; }
          .no-print { display: none !important; }
        }
      `}} />
    </div>
  )
}