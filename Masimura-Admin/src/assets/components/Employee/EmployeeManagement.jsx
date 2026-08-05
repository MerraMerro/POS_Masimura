import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Search, Trash2, X, Users, Briefcase, DollarSign, UserCheck, UserX } from 'lucide-react'
import { API_URL } from '../../../config/api'

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('Semua')
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    namaKaryawan: '',
    jabatan: 'Kasir',
    gajiPokok: '',
    status: 'Aktif'
  })

  const jabatanOptions = ['Kasir', 'Admin']

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/api/employees`)
      const data = await res.json()
      setEmployees(data)
    } catch (err) {
      console.error('Gagal mengambil data karyawan:', err)
    }
  }

  // --- LOGIKA MODAL & FORM ---
  const handleOpenModal = (emp = null) => {
    if (emp) {
      setEditingId(emp._id)
      setFormData({
        namaKaryawan: emp.namaKaryawan,
        jabatan: emp.jabatan,
        gajiPokok: emp.gajiPokok,
        status: emp.status
      })
    } else {
      setEditingId(null)
      setFormData({
        namaKaryawan: '',
        jabatan: 'Kasir',
        gajiPokok: '',
        status: 'Aktif'
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsProcessing(true)

    const url = editingId 
      ? `${API_URL}/api/employees/${editingId}`
      : `${API_URL}/api/employees`
    const method = editingId ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        fetchEmployees()
        setIsModalOpen(false)
      } else {
        alert('Gagal menyimpan data karyawan')
      }
    } catch (err) {
      console.error('Error saat submit:', err)
      alert('Terjadi kesalahan koneksi')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus data karyawan ${nama}? (Aksi ini tidak bisa dibatalkan)`)) return
    try {
      const res = await fetch(`${API_URL}/api/employees/${id}`, { method: 'DELETE' })
      if (res.ok) fetchEmployees()
    } catch (err) {
      console.error('Gagal menghapus karyawan:', err)
    }
  }

  // --- FILTER & CALCULATIONS ---
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.namaKaryawan.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'Semua' || emp.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  // Kalkulasi Total Pengeluaran Gaji (Hanya untuk karyawan aktif)
  const totalGajiAktif = employees
    .filter(emp => emp.status === 'Aktif')
    .reduce((sum, emp) => sum + (emp.gajiPokok || 0), 0)

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      
      {/* Header Panel & Ringkasan Gaji */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              Kelola Data Karyawan
            </h3>
            <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manajemen staf, jabatan, dan beban gaji per bulan
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-4 py-2 sm:py-2.5 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:opacity-95 transition-all text-xs sm:text-sm font-semibold whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Karyawan</span>
          </button>
        </div>

        {/* Kartu Ringkasan Beban Gaji */}
        <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col justify-center relative overflow-hidden">
          <DollarSign className="absolute -right-2 -bottom-4 w-24 h-24 sm:w-32 sm:h-32 text-white/10" />
          <p className="text-blue-100 text-xs sm:text-sm font-medium">Estimasi Beban Gaji (Aktif)</p>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            Rp {totalGajiAktif.toLocaleString('id-ID')}
          </h2>
          <p className="text-[10px] sm:text-xs text-blue-200 mt-1 sm:mt-2">/ bulan</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-sm">
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama karyawan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['Semua', 'Aktif', 'Nonaktif'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
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

      {/* Table Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {/* min-w-[700px] memaksa tabel tetap lebar di layar HP dan bisa di-scroll secara horizontal */}
          <table className="w-full min-w-175">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Nama Karyawan</th>
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Jabatan</th>
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Gaji Pokok</th>
                <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Status</th>
                <th className="text-center p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 text-xs sm:text-sm">Belum ada data karyawan.</td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp._id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-linear-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs sm:text-sm font-bold shrink-0">
                          {emp.namaKaryawan.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">{emp.namaKaryawan}</p>
                          <p className="text-[10px] text-slate-400">Bergabung: {new Date(emp.tanggalMasuk).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center space-x-1.5 sm:space-x-2 text-slate-600 dark:text-slate-300">
                        <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                        <span className="text-xs sm:text-sm font-medium">{emp.jabatan}</span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                        Rp {emp.gajiPokok?.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className={`inline-flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-full ${
                        emp.status === 'Aktif'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}>
                        {emp.status === 'Aktif' ? <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <UserX className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                        <span>{emp.status}</span>
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5 sm:space-x-2">
                        <button onClick={() => handleOpenModal(emp)} className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition-colors">
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button onClick={() => handleDelete(emp._id, emp.namaKaryawan)} className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 rounded-lg transition-colors">
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

      {/* ================= MODAL TAMBAH/EDIT KARYAWAN ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-2xl overflow-hidden">
            
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                {editingId ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3 sm:space-y-4">
              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Nama Karyawan</label>
                <input
                  type="text"
                  required
                  value={formData.namaKaryawan}
                  onChange={(e) => setFormData({ ...formData, namaKaryawan: e.target.value })}
                  className="w-full p-2 sm:p-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Jabatan</label>
                <select
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  className="w-full p-2 sm:p-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                >
                  {jabatanOptions.map(jabatan => (
                    <option key={jabatan} value={jabatan}>{jabatan}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Gaji Pokok / Bulan (Rp)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.gajiPokok}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ 
                        ...formData, 
                        gajiPokok: val === '' ? '' : Number(val) 
                    });
                  }}
                  className="w-full p-2 sm:p-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white font-medium"
                  placeholder="Contoh: 3500000"
                />
              </div>

              <div>
                <label className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Status Karyawan</label>
                <div className="flex gap-4 mt-1.5 sm:mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="status" 
                      value="Aktif"
                      checked={formData.status === 'Aktif'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Aktif</span>
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
                    <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Nonaktif</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-2 sm:space-x-3 border-t border-slate-200 dark:border-slate-700 mt-4 sm:mt-6">
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
                  {isProcessing ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}