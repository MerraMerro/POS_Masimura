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
            color: colorMap[item.name] || '#f59e0b' // Default color jika kategori tidak cocok
          }))
          setData(formatted)
        }
      })
      .catch((err) => console.error('Gagal mengambil data chart:', err))
  }, [])

  return (
    <div className='bg-white dark:bg-slate-900 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm'>
      <div className='mb-6'>
        <h3 className='text-lg font-bold text-slate-800 dark:text-white'>
          Sales of Category
        </h3>
        <p className='text-sm text-slate-500 dark:text-slate-400'>
          Production Distribution
        </p>
      </div>

      <div className='h-48'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie 
              data={data} 
              cx='50%' 
              cy='50%' 
              innerRadius={40} 
              outerRadius={80} 
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
              }}
              formatter={(value, name) => [`${value}%`, name]}
            /> 
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className='space-y-3 mt-4'> 
        {data.map((item, index) => {
          return (
            <div className='flex items-center justify-between' key={index}>
              <div className='flex items-center space-x-3'>
                <div className='w-3 h-3 rounded-full shadow-sm' style={{ backgroundColor: item.color }} />
                <span className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                  {item.name}    
                </span>
              </div>
              <div className='text-sm font-bold text-slate-800 dark:text-white'>
                {item.value}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}