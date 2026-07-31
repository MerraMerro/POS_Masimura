import React, { useState, useEffect } from 'react'
import { DollarSign, ShoppingCart, Package, AlertTriangle, ArrowUpRight } from 'lucide-react'

export default function StatsGrid() {
  const [statsData, setStatsData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockCount: 0
  })

  useEffect(() => {
    fetch('http://localhost:5000/api/dashboard/stats')
      .then(res => res.json())
      .then(data => setStatsData(data))
      .catch(err => console.error('Gagal memuat statistik:', err))
  }, [])

  const cards = [
    {
      tittle: 'Total Pendapatan',
      value: `Rp ${(statsData.totalRevenue || 0).toLocaleString('id-ID')}`,
      change: 'Real-time',
      trend: 'up',
      Icon: DollarSign,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      tittle: 'Total Pesanan Selesai',
      value: statsData.totalOrders.toString(),
      change: 'Real-time',
      trend: 'up',
      Icon: ShoppingCart,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      tittle: 'Katalog Menu Active',
      value: statsData.totalProducts.toString(),
      change: 'Menu',
      trend: 'up',
      Icon: Package,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      tittle: 'Peringatan Stok Menipis',
      value: statsData.lowStockCount.toString(),
      change: 'Bahan Baku',
      trend: statsData.lowStockCount > 0 ? 'down' : 'up',
      Icon: AlertTriangle,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-slate-900/20 transition-all duration-300 group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                {card.tittle}
              </p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                {card.value}
              </p>
              <div className="flex items-center space-x-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-500">
                  {card.change}
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-xl ${card.bgColor} group-hover:scale-110 transition-all duration-300`}>
              <card.Icon className={`w-6 h-6 ${card.textColor}`} />
            </div>
          </div>
          <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full bg-linear-to-r ${card.color} rounded-full transition-all duration-300`} style={{ width: '100%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}