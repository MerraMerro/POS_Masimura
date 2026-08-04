import React from 'react'
import RevenueChart from './RevenueChart'
import SalesChart from './SalesChart'

export default function ChartSection() {
  return (
    <div className='grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6'>
      <div className='xl:col-span-2'>
        <RevenueChart />
      </div>
      <div className='space-y-4 sm:space-y-6'>
        <SalesChart />
      </div>
    </div>
  )
}