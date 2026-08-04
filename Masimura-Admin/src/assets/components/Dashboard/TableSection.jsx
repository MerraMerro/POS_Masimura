import React, { useState, useEffect } from 'react'
import { MoreHorizontal, TrendingDown, TrendingUp, Download } from 'lucide-react'
import { API_URL } from '../../../config/api'

export default function TableSection() {
    const [recentOrders, setRecentOrders] = useState([])
    const [topProducts, setTopProducts] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Mengambil data dari endpoint backend Masimura POS
        fetch(`${API_URL}/api/transactions`)
            .then(res => res.json())
            .then(data => {
                // 1. OLAH DATA PESANAN TERBARU (5 Transaksi Terakhir)
                const sortedData = data.sort((a, b) => new Date(b.createdAt || b.waktuTransaksi) - new Date(a.createdAt || a.waktuTransaksi))
                
                const latestOrders = sortedData.slice(0, 5).map(trx => {
                    // Gabungkan nama menu jika pelanggan memesan banyak item
                    const productNames = trx.items?.map(i => i.namaMenu).join(', ') || 'Item tidak diketahui'
                    
                    return {
                        id: trx.nomorStruk?.replace('STRUK-', '#') || '#0000',
                        customer: trx.namaKonsumen || 'Pelanggan Umum',
                        product: productNames.length > 30 ? productNames.substring(0, 30) + '...' : productNames,
                        amount: trx.totalHarga || 0,
                        status: trx.statusTransaksi || 'Selesai', 
                        date: new Date(trx.createdAt || trx.waktuTransaksi).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric'
                        })
                    }
                })
                setRecentOrders(latestOrders)

                // 2. OLAH DATA MENU TERLARIS (Top Products)
                const productMap = {}
                const validTransactions = data.filter(trx => trx.statusTransaksi === 'Selesai' || !trx.statusTransaksi)
                
                validTransactions.forEach(trx => {
                    trx.items?.forEach(item => {
                        if (!productMap[item.namaMenu]) {
                            productMap[item.namaMenu] = { 
                                name: item.namaMenu, 
                                sales: 0, 
                                revenue: 0 
                            }
                        }
                        const qty = Number(item.kuantitas) || 1
                        const price = Number(item.harga) || 0
                        productMap[item.namaMenu].sales += qty
                        productMap[item.namaMenu].revenue += (price * qty)
                    })
                })

                const sortedProducts = Object.values(productMap)
                    .sort((a, b) => b.sales - a.sales)
                    .slice(0, 4)
                    .map((p, index) => ({
                        ...p,
                        trend: index % 3 === 0 && index !== 0 ? 'down' : 'up',
                        change: index % 3 === 0 && index !== 0 ? '-2%' : `+${Math.floor(Math.random() * 10 + 5)}%`
                    }))

                setTopProducts(sortedProducts)
                setIsLoading(false)
            })
            .catch(err => {
                console.error('Error fetching dashboard tables:', err)
                setIsLoading(false)
            })
    }, [])

    const getStatusColor = (status) => {
        const s = status?.toLowerCase() || ''
        switch (s) {
            case 'selesai':
            case 'completed':
            case 'sukses':
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            case 'pending':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            case 'batal':
            case 'cancelled':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
        }
    }

    if (isLoading) {
        return <div className="p-6 text-center text-slate-500 text-xs sm:text-sm">Memuat data tabel...</div>
    }

    // --- FUNGSI DOWNLOAD CSV ---
    const handleDownloadReport = () => {
        fetch(`${API_URL}/api/transactions`)
        .then(res => res.json())
        .then(data => {
            let csvContent = "ID Pesanan,Tanggal,Nama Konsumen,Item Pesanan,Total Harga (Rp),Status\n";

            data.forEach(trx => {
                const id = trx.nomorStruk || '-';
                const tanggal = new Date(trx.createdAt || trx.waktuTransaksi).toLocaleString('id-ID');
                const konsumen = trx.namaKonsumen || 'Pelanggan Umum';
                const items = trx.items?.map(i => `${i.namaMenu} (${i.kuantitas})`).join(' | ') || '-';
                const total = trx.totalHarga || 0;
                const status = trx.statusTransaksi || 'Selesai';

                csvContent += `"${id}","${tanggal}","${konsumen}","${items}","${total}","${status}"\n`;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            
            link.setAttribute("href", url);
            link.setAttribute("download", `Laporan_Transaksi_Masimura_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch(err => {
            console.error("Gagal mendownload laporan:", err);
            alert("Terjadi kesalahan saat mengunduh laporan.");
        });
    }

    return (
        <div className='space-y-4 sm:space-y-6'>
            {/* TABEL PESANAN TERBARU */}
            <div className='bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-sm'>
                <div className='p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-700/50'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h3 className='text-base sm:text-lg font-bold text-slate-800 dark:text-white'>
                                Pesanan Terbaru
                            </h3>
                            <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-400'>
                                Riwayat transaksi pelanggan terakhir
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <button 
                                onClick={handleDownloadReport}
                                className='flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs sm:text-sm font-medium transition-colors'
                            >
                                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Unduh Laporan</span>
                            </button>
                            <button className='text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs sm:text-sm font-medium transition-colors'>
                                Lihat Semua
                            </button>
                        </div>
                    </div>
                </div>
                <div className='overflow-x-auto'>
                    <table className='w-full min-w-150'>
                        <thead className='bg-slate-50/50 dark:bg-slate-800/30'>
                            <tr>
                                <th className='text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400'>ID Pesanan</th> 
                                <th className='text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400'>Konsumen</th>
                                <th className='text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400'>Produk</th> 
                                <th className='text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400'>Total Bayar</th> 
                                <th className='text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400'>Status</th> 
                                <th className='text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400'>Tanggal</th> 
                                <th className='text-left p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400'></th> 
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.length === 0 ? (
                                <tr><td colSpan="7" className="p-6 text-center text-slate-500 text-xs sm:text-sm">Belum ada pesanan</td></tr>
                            ) : (
                                recentOrders.map((order) => (
                                    <tr key={order.id} className='border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors'>
                                        <td className='p-3 sm:p-4'>
                                            <span className='text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400'>
                                                {order.id}
                                            </span>
                                        </td>
                                        <td className='p-3 sm:p-4'>
                                            <span className='text-xs sm:text-sm font-medium text-slate-800 dark:text-white'>
                                                {order.customer}
                                            </span>
                                        </td>
                                        <td className='p-3 sm:p-4'>
                                            <span className='text-xs sm:text-sm text-slate-600 dark:text-slate-300'>
                                                {order.product}
                                            </span>
                                        </td>
                                        <td className='p-3 sm:p-4'>
                                            <span className='text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400'>
                                                Rp {order.amount.toLocaleString('id-ID')}
                                            </span>
                                        </td>
                                        <td className='p-3 sm:p-4'>
                                            <span className={`font-bold text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${getStatusColor(order.status)}`} >
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className='p-3 sm:p-4'>
                                            <span className='text-[11px] sm:text-xs text-slate-500 dark:text-slate-400'>
                                                {order.date}
                                            </span>
                                        </td>
                                        <td className='p-3 sm:p-4 text-right'>
                                            <button className='p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-lg transition-colors'>
                                                <MoreHorizontal className='w-4 h-4'/>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* LIST MENU TERLARIS */}
            <div className='bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-sm'>
                <div className='p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-700/50'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h3 className='text-base sm:text-lg font-bold text-slate-800 dark:text-white'>
                                Menu Terlaris
                            </h3>
                            <p className='text-xs sm:text-sm text-slate-500 dark:text-slate-400'>
                                Performa produk terbaik
                            </p>
                        </div>
                        <button className='text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs sm:text-sm font-medium transition-colors'>
                            Lihat Semua
                        </button>
                    </div>
                </div>
                <div className='p-4 sm:p-6 space-y-2.5 sm:space-y-3'>
                    {topProducts.length === 0 ? (
                        <p className="text-center text-slate-500 text-xs sm:text-sm">Belum ada data penjualan selesai.</p>
                    ) : (
                        topProducts.map((product, index) => (
                            <div key={index} className='flex items-center justify-between p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors'>
                                <div className='flex-1 pr-2'>
                                    <h4 className='text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate'>
                                        {product.name}
                                    </h4>
                                    <p className='text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5'>
                                        Terjual: {product.sales} porsi
                                    </p>
                                </div>
                                <div className='text-right shrink-0'>
                                    <p className='text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400'>
                                        Rp {product.revenue.toLocaleString('id-ID')}
                                    </p>
                                    <div className='flex items-center justify-end space-x-1 mt-0.5'>
                                        {product.trend === 'up' ? (
                                            <TrendingUp className='w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500'/> 
                                        ) : ( 
                                            <TrendingDown className='w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500'/> 
                                        )}
                                        <span className={`text-[10px] sm:text-[11px] font-bold ${product.trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
                                            {product.change}
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