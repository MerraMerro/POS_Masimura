import React, { useState, useEffect } from 'react'
import { Shield, Lock, User, Key, CheckCircle } from 'lucide-react'
import { API_URL } from '../../../config/api'

export default function AccountSettings() {
  const [users, setUsers] = useState([])
  const [currentAdmin, setCurrentAdmin] = useState(null)
  
  // Form State untuk edit akun admin yang sedang login
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
      const res = await fetch(`${API_URL}/api/users`) // sesuaikan endpoint get users
      const data = await res.json()
      setUsers(data)

      // Misal mengambil data admin yang sedang aktif dari localStorage/Session
      const loggedInUser = JSON.parse(localStorage.getItem('user')) || data[0] 
      setCurrentAdmin(loggedInUser)
      setFormData({
        namaLengkap: loggedInUser?.namaLengkap || '',
        username: loggedInUser?.username || '',
        password: ''
      })
    } catch (err) {
      console.error('Gagal mengambil data user:', err)
    }
  }

  const handleUpdateAccount = async (e) => {
    e.preventDefault()
    if (!currentAdmin) return
    setIsProcessing(true)
    setSuccessMessage('')

    try {
      const res = await fetch(`${API_URL}/api/users/profile/${currentAdmin._id}`, {
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          Pengaturan Akun & Keamanan
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Kelola informasi kredensial login Anda sebagai Admin.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center gap-2 text-sm font-medium">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Form Edit Akun Admin Aktif */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-sm">
        <h4 className="text-md font-bold text-slate-800 dark:text-white mb-4">Edit Kredensial Admin</h4>
        <form onSubmit={handleUpdateAccount} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Nama Lengkap</label>
            <input
              type="text"
              value={formData.namaLengkap}
              onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Username / Email</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Password Baru (Kosongkan jika tidak ingin mengubah)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {isProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      {/* Daftar User Sistem (Menampilkan Master Admin & Master Kasir yang Terkunci) */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-sm">
        <h4 className="text-md font-bold text-slate-800 dark:text-white mb-2">Daftar Akun Terdaftar di Sistem</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Akun dengan status <span className="font-semibold text-amber-600">Master</span> dilindungi sistem dan kredensialnya tidak dapat dilihat atau diubah oleh Admin biasa.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Nama</th>
                <th className="p-3">Username</th>
                <th className="p-3">Role / Hak Akses</th>
                <th className="p-3 text-center">Status Keamanan</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isMaster = u.role === 'Master Admin' || u.role === 'Master Kasir' || u.isMaster;
                return (
                  <tr key={u._id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-3 font-medium text-slate-800 dark:text-white">{u.namaLengkap}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">
                      {isMaster ? '•••••••••••• (Terkunci)' : u.username}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        isMaster ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {isMaster ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg">
                          <Lock className="w-3.5 h-3.5" /> Protected
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">Dapat Dikelola</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}