import React, { useState, useEffect } from 'react'
import { DollarSign, ShoppingBag, Utensils, AlertOctagon } from 'lucide-react'
import { API_URL } from '../../../config/api'

export default function DashboardStats() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        lowStockCount: 0
    })

    useEffect(() => {
        fetch(`${API_URL}/api/dashboard/stats`)
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error('Gagal mengambil data stats dashboard:', err))
    }, [])

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
            
            {/* Kartu 1: Total Omzet */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center space-x-3 sm:space-x-4">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Total Omzet</p>
                    <h3 className="text-base sm:text-xl font-black text-slate-800 dark:text-white mt-0.5 sm:mt-1">
                        Rp {stats.totalRevenue.toLocaleString('id-ID')}
                    </h3>
                </div>
            </div>

            {/* Kartu 2: Total Pesanan */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center space-x-3 sm:space-x-4">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Total Pesanan</p>
                    <h3 className="text-base sm:text-xl font-black text-slate-800 dark:text-white mt-0.5 sm:mt-1">
                        {stats.totalOrders} <span className="text-xs sm:text-sm font-semibold text-slate-400">Transaksi</span>
                    </h3>
                </div>
            </div>

            {/* Kartu 3: Total Menu */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center space-x-3 sm:space-x-4">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Utensils className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Menu Aktif</p>
                    <h3 className="text-base sm:text-xl font-black text-slate-800 dark:text-white mt-0.5 sm:mt-1">
                        {stats.totalProducts} <span className="text-xs sm:text-sm font-semibold text-slate-400">Produk</span>
                    </h3>
                </div>
            </div>

            {/* Kartu 4: Peringatan Stok */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex items-center space-x-3 sm:space-x-4">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <AlertOctagon className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Bahan Menipis</p>
                    <h3 className="text-base sm:text-xl font-black text-slate-800 dark:text-white mt-0.5 sm:mt-1">
                        {stats.lowStockCount} <span className="text-xs sm:text-sm font-semibold text-slate-400">Item</span>
                    </h3>
                </div>
            </div>

        </div>
    )
}