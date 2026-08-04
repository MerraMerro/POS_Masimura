import React, { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { API_URL } from '../../../config/api'

export default function SalesChart() {
  const [data, setData] = useState([
    { name: "East Side", value: 0, color: "#3b82f6" },
    { name: "West Side", value: 0, color: "#8b5cf6" },
    { name: "Drinks", value: 0, color: "#10b981" },
  ])

  useEffect(() => {
    fetch(`${API_URL}/api/dashboard/analytics`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.categoryDistribution) {
          const colorMap = {
            'East Side': '#3b82f6',
            'West Side': '#8b5cf6',
            'Drinks': '#10b981'
          }
          const formatted = resData.categoryDistribution.map((item) => ({
            name: item.name,
            value: item.percentage,
            color: colorMap[item.name] || '#f59e0b'
          }))
          setData(formatted)
        }
      })
      .catch((err) => console.error('Gagal mengambil data chart:', err))
  }, [])

  return (
    <div className='bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm'>
      <div className='mb-4 sm:mb-6'>
        <h3 className='text-base sm:text-lg font-bold text-slate-800 dark:text-white'>
          Sales of Category
        </h3>
        <p className='text-[11px] sm:text-xs text-slate-500 dark:text-slate-400'>
          Production Distribution
        </p>
      </div>

      {/* Tinggi diagram menyesuaikan layar */}
      <div className='h-40 sm:h-48'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie 
              data={data} 
              cx='50%' 
              cy='50%' 
              innerRadius={35} 
              outerRadius={70} 
              paddingAngle={5} 
              dataKey='value'
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(51, 65, 85, 0.5)',
                borderRadius: '12px',
                color: '#fff',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                fontSize: '12px',
              }}
              formatter={(value, name) => [`${value}%`, name]}
            /> 
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className='space-y-2 sm:space-y-3 mt-3 sm:mt-4'> 
        {data.map((item, index) => {
          return (
            <div className='flex items-center justify-between' key={index}>
              <div className='flex items-center space-x-2 sm:space-x-3'>
                <div className='w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-sm' style={{ backgroundColor: item.color }} />
                <span className='text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400'>
                  {item.name}    
                </span>
              </div>
              <div className='text-xs sm:text-sm font-bold text-slate-800 dark:text-white'>
                {item.value}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}