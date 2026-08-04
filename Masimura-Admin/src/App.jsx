import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import LoginPage from './assets/components/Auth/LoginPage'
import PosPage from './assets/components/POS/PosPage'
import Dashboard from './assets/components/Dashboard/Dashboard'
import MenuManagement from './assets/components/Menu/MenuManagement'
import StockManagement from './assets/components/Stocks/StockManagement'
import CategoryManagement from './assets/components/Category/CategoryManagement'
import TransactionManagement from './assets/components/Transactions/TransactionManagement'

// Layout Components
import Header from './assets/components/layout/Header'
import Slidebar from './assets/components/layout/Slidebar'
import EmployeeManagement from './assets/components/Employee/EmployeeManagement'
import ReportPage from './assets/components/Reporting/ReportPage'
import AccountSettings from './assets/components/Auth/AccountSettings'
import PromoManagement from './assets/components/Promo/PromoManagement'
import ImportHistory from './assets/components/ImportHistory'

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        setCurrentUser(user)
      } catch (e) {
        localStorage.removeItem('user')
      }
    }
  }, [])

  const handleLoginSuccess = (user) => {
    setCurrentUser(user)
    if (user.role === 'kasir') {
      navigate('/pos')
    } else {
      navigate('/dashboard')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setCurrentUser(null)
    navigate('/login')
  }

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white overflow-hidden">
      {/* 1. Slidebar Samping (Membentang Penuh dari Atas) */}
      <Slidebar
        collapsed={sidebarCollapsed}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* 2. Area Kanan (Header + Konten Utama) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          currentUser={currentUser}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={handleLogout}
        />

        {/* Padding dikurangi menjadi p-3 sm:p-4 agar pas dan menghilangkan space kosong */}
        <main className="flex-1 p-3 sm:p-4 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <Routes>
            {/* Khusus Kasir */}
            {currentUser.role === 'kasir' && (
              <Route path="/pos" element={<PosPage />} />
            )}

            {/* Khusus Admin */}
            {currentUser.role === 'admin' && (
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/inventory/menu" element={<MenuManagement />} />
                <Route path="/inventory/category" element={<CategoryManagement />} />
                <Route path="/inventory/stock" element={<StockManagement />} />
                <Route path="/transactions" element={<TransactionManagement />} />
                <Route path='/employee' element={<EmployeeManagement />} />
                <Route path='/reporting' element={<ReportPage />} />
                <Route path='/setting' element={<AccountSettings />} />
                <Route path='/promotion' element={<PromoManagement />} />
                <Route path='/import' element={<ImportHistory />} />
              </>
            )}

            {/* Redirect Default */}
            <Route
              path="*"
              element={
                <Navigate
                  to={currentUser.role === 'kasir' ? '/pos' : '/dashboard'}
                  replace
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  )
}