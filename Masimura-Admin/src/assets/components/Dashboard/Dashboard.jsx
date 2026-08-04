import React from 'react'
import StatsGrid from './StatsGrid'
import ChartSection from './ChartSection'
import TableSection from './TableSection'
import ActivityFeed from './ActivityFeed'

function Dashboard() {
  return (
    <div className='space-y-4 sm:space-y-6 pb-6'>
      {/* Stats Grid: Menyesuaikan kolom agar pas di layar HP maupun PC */}
      <StatsGrid />

      {/* Chart Section */}
      <ChartSection />

      {/* Bagian Tabel & Aktivitas: 1 kolom di HP, 3 kolom di layar besar */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6'>
        <div className='xl:col-span-2 overflow-x-auto'>
          <TableSection />
        </div>
        <div>
          <ActivityFeed />
        </div>        
      </div>
    </div>
  )
}

export default Dashboard