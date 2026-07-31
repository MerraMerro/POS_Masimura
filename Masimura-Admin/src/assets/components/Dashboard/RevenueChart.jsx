import React, { useState, useEffect } from 'react'
import { API_URL } from '../../../config/api'

export default function RevenueChart() {
  const [monthlyData, setMonthlyData] = useState(Array(12).fill(0))
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  
  // Ambil tahun berjalan secara dinamis
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    fetch(`${API_URL}/api/dashboard/analytics`)
      .then(res => res.json())
      .then(data => {
        if (data.monthlyRevenue) setMonthlyData(data.monthlyRevenue)
      })
      .catch(err => console.error('Gagal mengambil data chart pendapatan:', err))
  }, [])

  // Agar grafik tidak error jika semua data 0, kita beri nilai default max 100.000
  const maxRevenue = Math.max(...monthlyData, 100000)

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-lg font-bold text-slate-800 dark:text-white">Grafik Pendapatan {currentYear}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Omzet Penjualan Per Bulan</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shadow-md shadow-blue-500/50"></span>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Pendapatan (Rp)</span>
        </div>
      </div>

      {/* Visualisasi Grafik Batang */}
      <div className="h-80 flex items-end justify-between gap-2 pt-8 pb-2 px-2 border-b border-slate-200 dark:border-slate-700">
        {monthlyData.map((val, idx) => {
          // Kalkulasi tinggi batang persentase
          const heightPercent = Math.min(Math.round((val / maxRevenue) * 100), 100)
          
          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              
              {/* Tooltip Pop-up */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 dark:bg-slate-700 text-white text-[10px] py-1 px-2 rounded-lg shadow-xl whitespace-nowrap z-10 pointer-events-none font-bold">
                Rp {val.toLocaleString('id-ID')}
              </div>
              
              {/* Batang Grafik */}
              <div 
                style={{ height: `${heightPercent > 0 ? heightPercent : 2}%` }} 
                className={`w-full max-w-7 rounded-t-lg transition-all duration-700 ease-out ${
                  val > 0 
                    ? 'bg-linear-to-t from-blue-600 to-indigo-500 group-hover:from-blue-500 group-hover:to-indigo-400 shadow-lg shadow-blue-500/25' 
                    : 'bg-slate-100 dark:bg-slate-800'
                }`}
              />
              
              {/* Label Bulan */}
              <span className={`text-[11px] mt-2 font-medium transition-colors ${
                val > 0 ? 'text-slate-800 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'
              }`}>
                {months[idx]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}