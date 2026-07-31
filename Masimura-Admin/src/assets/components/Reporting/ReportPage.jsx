import React, { useState, useEffect } from 'react'
import { FileText, Download, TrendingUp, TrendingDown, DollarSign, Calendar, Users, ShoppingBag } from 'lucide-react'
import { API_URL } from '../../../config/api'

export default function ReportPage() {
    const [transactions, setTransactions] = useState([])
    const [employees, setEmployees] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // Filter State (Default: Bulan dan Tahun Saat Ini)
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()) // 0 - 11
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]

    useEffect(() => {
        Promise.all([
            fetch(`${API_URL}/api/transactions`).then(res => res.json()),
            fetch(`${API_URL}/api/employees`).then(res => res.json())
        ])
        .then(([txData, empData]) => {
            setTransactions(Array.isArray(txData) ? txData : [])
            setEmployees(Array.isArray(empData) ? empData : [])
            setIsLoading(false)
        })
        .catch(err => {
            console.error('Gagal mengambil data laporan:', err)
            setIsLoading(false)
        })
    }, [])

    // --- KALKULASI DATA BERDASARKAN FILTER ---
    
    // 1. Filter transaksi hanya untuk bulan & tahun yang dipilih
    const filteredTransactions = transactions.filter(trx => {
        const date = new Date(trx.createdAt || trx.waktuTransaksi)
        return date.getMonth() === Number(selectedMonth) && date.getFullYear() === Number(selectedYear) && trx.statusTransaksi === 'Selesai'
    })

    // 2. Total Pendapatan KOTOR (Penjualan)
    const totalPendapatan = filteredTransactions.reduce((sum, trx) => sum + (trx.totalHarga || 0), 0)
    const totalPesanan = filteredTransactions.length

    // 3. Total Pengeluaran (Beban Gaji Karyawan Aktif)
    const totalGaji = employees
        .filter(emp => emp.status === 'Aktif')
        .reduce((sum, emp) => sum + (emp.gajiPokok || 0), 0)

    // 4. LABA BERSIH (Pendapatan - Pengeluaran)
    const labaBersih = totalPendapatan - totalGaji

    // --- FUNGSI DOWNLOAD CSV KHUSUS LAPORAN KEUANGAN ---
    const handleDownloadReport = () => {
        let csvContent = `LAPORAN LABA RUGI MASIMURA POS\n`
        csvContent += `Periode: ${months[selectedMonth]} ${selectedYear}\n\n`
        
        csvContent += `PENDAPATAN\n`
        csvContent += `Total Penjualan (${totalPesanan} Pesanan),Rp ${totalPendapatan}\n\n`
        
        csvContent += `PENGELUARAN\n`
        csvContent += `Beban Gaji Karyawan,Rp ${totalGaji}\n\n`
        
        csvContent += `LABA BERSIH,Rp ${labaBersih}\n`

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        
        link.setAttribute("href", url)
        link.setAttribute("download", `Laporan_Keuangan_${months[selectedMonth]}_${selectedYear}.csv`)
        link.style.visibility = 'hidden'
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (isLoading) return <div className="p-8 text-center text-slate-500">Memuat data laporan keuangan...</div>

    return (
        <div className="space-y-6">
            
            {/* Header & Filter Panel */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-500" />
                        Laporan Laba / Rugi
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Ringkasan pendapatan penjualan dan beban operasional
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Filter Bulan */}
                    <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                        <Calendar className="w-4 h-4 text-slate-400 ml-2" />
                        <select 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                        >
                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                        <select 
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer border-l border-slate-300 dark:border-slate-600 pl-2"
                        >
                            <option value="2026">2026</option>
                            <option value="2025">2025</option>
                        </select>
                    </div>

                    <button 
                        onClick={handleDownloadReport}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-sm font-bold w-full sm:w-auto"
                    >
                        <Download className="w-4 h-4" />
                        <span>Unduh CSV</span>
                    </button>
                </div>
            </div>

            {/* Kartu Ringkasan (Summary Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Pendapatan */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm relative overflow-hidden">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Pendapatan</p>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                                Rp {totalPendapatan.toLocaleString('id-ID')}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* 2. Pengeluaran (Beban Gaji) */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm relative overflow-hidden">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Beban Gaji Karyawan</p>
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                                Rp {totalGaji.toLocaleString('id-ID')}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* 3. Laba Bersih */}
                <div className={`rounded-2xl p-6 shadow-lg relative overflow-hidden text-white ${
                    labaBersih >= 0 
                        ? 'bg-linear-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25' 
                        : 'bg-linear-to-br from-red-500 to-rose-600 shadow-red-500/25'
                }`}>
                    <DollarSign className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
                    <div className="flex items-center justify-between mb-1 relative z-10">
                        <p className="text-sm font-medium text-white/80">Laba Bersih</p>
                        {labaBersih >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <h2 className="text-3xl font-black relative z-10">
                        Rp {labaBersih.toLocaleString('id-ID')}
                    </h2>
                    <p className="text-xs font-medium text-white/70 mt-1 relative z-10">
                        {labaBersih >= 0 ? 'Profitabilitas Positif' : 'Mengalami Kerugian'}
                    </p>
                </div>
            </div>

            {/* Rincian Transaksi Bulan Terpilih */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                        Rincian Penjualan ({months[selectedMonth]} {selectedYear})
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                            <tr>
                                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Tanggal</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">ID Pesanan</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Konsumen</th>
                                <th className="text-right p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Pendapatan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-500">
                                        Tidak ada transaksi pada bulan ini.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((trx, idx) => (
                                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                            {new Date(trx.createdAt || trx.waktuTransaksi).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-blue-600 dark:text-blue-400">
                                            {trx.nomorStruk}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-800 dark:text-white">
                                            {trx.namaKonsumen}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right">
                                            + Rp {trx.totalHarga?.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    )
}