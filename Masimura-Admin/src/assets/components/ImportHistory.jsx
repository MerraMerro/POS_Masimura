import React, { useState, useEffect } from 'react'
import { Calendar, DollarSign, PlusCircle, Trash2, Save, FileText, CheckCircle2 } from 'lucide-react'
import { API_URL } from '../../config/api' // Sesuaikan path import dengan struktur folder Anda

export default function ImportHistory() {
  const [menus, setMenus] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Form State
  const [tanggal, setTanggal] = useState('')
  const [totalHarga, setTotalHarga] = useState('')
  const [items, setItems] = useState([{ namaMenu: '', kuantitas: 1 }])

  useEffect(() => {
    // Ambil daftar menu untuk dropdown pilihan agar tidak salah ketik
    fetch(`${API_URL}/api/menus`)
      .then(res => res.json())
      .then(data => setMenus(data))
      .catch(err => console.error('Gagal memuat menu:', err))
  }, [])

  // --- LOGIKA ITEM DINAMIS ---
  const handleAddItem = () => {
    setItems([...items, { namaMenu: '', kuantitas: 1 }])
  }

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, idx) => idx !== index)
    setItems(newItems)
  }

  const handleChangeItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  // --- LOGIKA SUBMIT (KIRIM KE BACKEND) ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!tanggal || !totalHarga) {
      return alert('Tanggal dan Total Pemasukan wajib diisi!')
    }

    // Filter item yang kosong agar tidak ikut terkirim
    const validItems = items.filter(item => item.namaMenu.trim() !== '' && item.kuantitas > 0)
    
    if (validItems.length === 0) {
      return alert('Minimal masukkan 1 menu yang terjual!')
    }

    setIsProcessing(true)
    setSuccessMsg('')

    // Format Data untuk API
    const payload = {
      nomorStruk: `History${tanggal}`,
      namaKonsumen: `Pelanggan Umum`,
      waktuTransaksi: `${tanggal}T12:00:00.000Z`, // Set ke penghujung hari
      totalHarga: Number(totalHarga),
      nominalBayar: Number(totalHarga),
      metodePembayaran: 'Tunai', 
      items: validItems
    }

    try {
      const res = await fetch(`${API_URL}/api/transactions/import-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setSuccessMsg(`Data rekap tanggal ${tanggal} berhasil disimpan!`)
        // Reset form untuk hari berikutnya (biarkan item 1 baris kosong)
        setTotalHarga('')
        setItems([{ namaMenu: '', kuantitas: 1 }])
        // Majukan tanggal otomatis 1 hari agar input makin cepat
        const nextDay = new Date(tanggal)
        nextDay.setDate(nextDay.getDate() + 1)
        setTanggal(nextDay.toISOString().split('T')[0])
      } else {
        const errData = await res.json()
        alert('Gagal: ' + errData.message)
      }
    } catch (err) {
      console.error('Error submit:', err)
      alert('Terjadi kesalahan koneksi server.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-500" />
          Input Rekap Historis (Manual)
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Gunakan form ini untuk memindahkan data dari buku catatan (misal: Juli 2026). Data ini <b>TIDAK AKAN</b> memotong stok gudang saat ini.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          <p className="font-semibold text-sm">{successMsg}</p>
        </div>
      )}

      {/* Form Input */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input Tanggal */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Tanggal Rekap</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Input Total Harga */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Total Pendapatan Harian (Rp)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  required
                  placeholder="Misal: 99287"
                  value={totalHarga}
                  onChange={(e) => setTotalHarga(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section Item Menu */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
              <label className="text-sm font-bold text-slate-800 dark:text-white block">
                Rincian Menu Terjual
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> Tambah Baris
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <select
                      value={item.namaMenu}
                      onChange={(e) => handleChangeItem(index, 'namaMenu', e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                    >
                      <option value="">-- Pilih Menu --</option>
                      {menus.map((m, idx) => (
                        <option key={idx} value={m.namaMenu}>{m.namaMenu}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.kuantitas}
                      onChange={(e) => handleChangeItem(index, 'kuantitas', Number(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tombol Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isProcessing ? 'Menyimpan...' : 'Simpan Rekap Harian'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}