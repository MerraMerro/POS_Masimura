import React, { useState, useEffect } from 'react'
import { Clock, ShoppingCart, AlertTriangle, Utensils, UserPlus } from 'lucide-react'

export default function ActivityFeed() {
    const [activities, setActivities] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // 1. Ambil SEMUA data (Transaksi, Stok, Menu, Karyawan) secara bersamaan
        Promise.all([
            fetch('http://localhost:5000/api/transactions').then(res => res.json()),
            fetch('http://localhost:5000/api/stocks').then(res => res.json()),
            fetch('http://localhost:5000/api/menus').then(res => res.json()),
            fetch('http://localhost:5000/api/employees').then(res => res.json())
        ])
        .then(([txData, stockData, menuData, empData]) => {
            const feed = []

            // -- OLAH DATA: Transaksi Terbaru --
            if (Array.isArray(txData)) {
                const sortedTx = txData.sort((a, b) => new Date(b.createdAt || b.waktuTransaksi) - new Date(a.createdAt || a.waktuTransaksi)).slice(0, 5)
                sortedTx.forEach(tx => {
                    feed.push({
                        id: `tx-${tx._id}`,
                        icon: ShoppingCart,
                        title: 'Pesanan Baru Masuk',
                        description: `${tx.nomorStruk} a.n ${tx.namaKonsumen} (Rp ${tx.totalHarga?.toLocaleString('id-ID')})`,
                        timestamp: new Date(tx.createdAt || tx.waktuTransaksi),
                        color: 'text-emerald-500',
                        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
                    })
                })
            }

            // -- OLAH DATA: Peringatan Stok Menipis --
            if (Array.isArray(stockData)) {
                const lowStocks = stockData.filter(s => (s.sisaStok || 0) <= 5)
                lowStocks.forEach(stock => {
                    feed.push({
                        id: `stk-${stock._id}`,
                        icon: AlertTriangle,
                        title: 'Peringatan Stok Menipis',
                        description: `Sisa bahan ${stock.namaBahan} tinggal ${stock.sisaStok}! Segera restock.`,
                        timestamp: new Date(stock.updatedAt || Date.now()), 
                        color: 'text-red-500',
                        bgColor: 'bg-red-100 dark:bg-red-900/30'
                    })
                })
            }

            // -- OLAH DATA: Menu Baru Ditambahkan --
            if (Array.isArray(menuData)) {
                const sortedMenus = menuData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
                sortedMenus.forEach(menu => {
                    if (menu.createdAt) { // Pastikan ada field createdAt
                        feed.push({
                            id: `menu-${menu._id}`,
                            icon: Utensils,
                            title: 'Menu Baru Ditambahkan',
                            description: `${menu.namaMenu} ditambahkan ke kategori ${menu.kategori}.`,
                            timestamp: new Date(menu.createdAt),
                            color: 'text-blue-500',
                            bgColor: 'bg-blue-100 dark:bg-blue-900/30'
                        })
                    }
                })
            }

            // -- OLAH DATA: Karyawan Baru Terdaftar --
            if (Array.isArray(empData)) {
                const sortedEmps = empData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
                sortedEmps.forEach(emp => {
                    if (emp.createdAt) { // Pastikan ada field createdAt
                        feed.push({
                            id: `emp-${emp._id}`,
                            icon: UserPlus,
                            title: 'Karyawan Baru Terdaftar',
                            description: `${emp.namaKaryawan} bergabung sebagai ${emp.jabatan}.`,
                            timestamp: new Date(emp.createdAt),
                            color: 'text-purple-500',
                            bgColor: 'bg-purple-100 dark:bg-purple-900/30'
                        })
                    }
                })
            }

            // 2. SORTING & FORMATTING WAKTU (Urutkan SEMUA dari yang terbaru ke terlama)
            feed.sort((a, b) => b.timestamp - a.timestamp)
            
            const now = new Date()
            // Ambil hanya 5 aktivitas terbaru dari semua gabungan tadi
            const formattedFeed = feed.slice(0, 6).map(item => {
                const diffMs = now - item.timestamp
                const diffMins = Math.floor(diffMs / 60000)
                const diffHours = Math.floor(diffMins / 60)
                const diffDays = Math.floor(diffHours / 24)

                let timeStr = ''
                if (diffMins < 1) timeStr = 'Baru saja'
                else if (diffMins < 60) timeStr = `${diffMins} menit yang lalu`
                else if (diffHours < 24) timeStr = `${diffHours} jam yang lalu`
                else timeStr = `${diffDays} hari yang lalu`

                return { ...item, time: timeStr }
            })

            setActivities(formattedFeed)
            setIsLoading(false)
        })
        .catch(err => {
            console.error('Gagal mengambil data aktivitas:', err)
            setIsLoading(false)
        })
    }, [])

    return (
        <div className='bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm'>
            <div className='p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between'>
                <div>
                    <h3 className='text-lg font-bold text-slate-800 dark:text-white'>
                        Aktivitas Sistem
                    </h3>
                    <p className='text-sm text-slate-500 dark:text-slate-400'>
                        Riwayat notifikasi terbaru
                    </p>
                </div>
                <button className='text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors'>
                    Lihat Semua
                </button>
            </div>
            
            <div className='p-6'>
                <div className='space-y-4 max-h-1000 overflow-y-auto pr-2'>
                    {isLoading ? (
                        <p className="text-center text-sm text-slate-500">Memuat aktivitas...</p>
                    ) : activities.length === 0 ? (
                        <p className="text-center text-sm text-slate-500">Belum ada aktivitas tercatat.</p>
                    ) : (
                        activities.map((activity) => (
                            <div key={activity.id} className='flex items-start space-x-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors'>
                                <div className={`p-2 rounded-lg shrink-0 ${activity.bgColor}`}>
                                    <activity.icon className={`w-4 h-4 ${activity.color}`} />
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <h4 className='text-sm font-bold text-slate-800 dark:text-white'>
                                        {activity.title}
                                    </h4>
                                    <p className='text-sm text-slate-600 dark:text-slate-400 truncate mt-0.5'>
                                        {activity.description}
                                    </p>
                                    <div className='flex items-center space-x-1.5 mt-1.5'>
                                        <Clock className='w-3 h-3 text-slate-400'/>
                                        <span className='text-xs font-medium text-slate-500 dark:text-slate-400'>
                                            {activity.time}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}