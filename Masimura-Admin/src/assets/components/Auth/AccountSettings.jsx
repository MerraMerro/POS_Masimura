import React, { useState, useEffect } from 'react'
import { Shield, Lock, User, Key, CheckCircle } from 'lucide-react'
import { API_URL } from '../../../config/api'

export default function AccountSettings() {
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('') // State untuk ID user yang dipilih dari dropdown
  
  const [formData, setFormData] = useState({
    namaLengkap: '',
    username: '',
    password: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchUsersData()
  }, [])

  const fetchUsersData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`)
      const data = await res.json()
      
      // Filter hanya user yang boleh diedit (bukan Master Admin/Kasir jika ingin dikunci)
      const editableUsers = data.filter(u => u.role !== 'Master Admin' && u.role !== 'Master Kasir' && !u.isMaster)
      setUsers(editableUsers)

      // Set default ke user pertama yang bisa diedit jika ada
      if (editableUsers.length > 0) {
        setSelectedUserId(editableUsers[0]._id)
        setFormData({
          namaLengkap: editableUsers[0].namaLengkap || editableUsers[0].nama || '',
          username: editableUsers[0].username || '',
          password: ''
        })
      }
    } catch (err) {
      console.error('Gagal mengambil data user:', err)
    }
  }

  // Ketika dropdown akun dipilih, otomatis isi form dengan data user tersebut
  const handleSelectUser = (e) => {
    const userId = e.target.value
    setSelectedUserId(userId)

    const foundUser = users.find(u => u._id === userId)
    if (foundUser) {
      setFormData({
        namaLengkap: foundUser.namaLengkap || foundUser.nama || '',
        username: foundUser.username || '',
        password: ''
      })
    }
  }

  const handleUpdateAccount = async (e) => {
    e.preventDefault()
    if (!selectedUserId) {
      alert('Pilih akun terlebih dahulu!')
      return
    }

    setIsProcessing(true)
    setSuccessMessage('')

    try {
      const res = await fetch(`${API_URL}/api/users/profile/${selectedUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await res.json()
      if (res.ok) {
        setSuccessMessage('Akun berhasil diperbarui!')
        fetchUsersData()
      } else {
        alert(result.message || 'Gagal memperbarui akun')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Terjadi kesalahan koneksi')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto pb-6">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          Pengaturan Akun & Keamanan
        </h3>
        <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1 sm:mt-1.5">
          Pilih akun dari daftar untuk memperbarui informasi kredensial login.
        </p>
      </div>

      {successMessage && (
        <div className="p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-medium">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Form Edit Akun dengan Dropdown Pemilihan User */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-6 shadow-sm">
        <h4 className="text-sm sm:text-md font-bold text-slate-800 dark:text-white mb-3 sm:mb-4">Pilih & Edit Akun</h4>
        
        <form onSubmit={handleUpdateAccount} className="space-y-3 sm:space-y-4">
          {/* DROPDOWN PEMILIHAN USER */}
          <div>
            <label className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Pilih Akun yang Ingin Diedit</label>
            <select
              value={selectedUserId}
              onChange={handleSelectUser}
              className="w-full p-2 sm:p-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.nama || u.namaLengkap} ({u.username}) — [{u.role}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Nama Lengkap</label>
            <input
              type="text"
              value={formData.namaLengkap}
              onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
              className="w-full p-2 sm:p-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Username Baru</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full p-2 sm:p-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Password Baru (Kosongkan jika tidak ingin mengubah)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2 sm:p-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="pt-2 sm:pt-3">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {isProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}