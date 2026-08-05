import { Bell, ChevronDown, Filter, Menu, Search, Settings, Sun, Moon } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom' 

function Header({ sideBarCollapsed, onToggleSidebar, onSearch, currentUser }) {
    
    const location = useLocation() 

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme')
        if (saved) return saved === 'dark'
        return document.documentElement.classList.contains('dark')
    })

    useEffect(() => {
        const root = document.documentElement
        if (isDarkMode) {
            root.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            root.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }, [isDarkMode])

    const getHeaderTitle = () => {
        switch (location.pathname) {
            case '/pos':
                return { title: 'POS Kasir', subtitle: 'Kelola transaksi dan pesanan pelanggan' }
            case '/dashboard':
                return { title: 'Dashboard', subtitle: "Welcome back, Here's what's happening today" }
            case '/inventory/menu':
                return { title: 'Menu Makanan', subtitle: 'Kelola daftar menu minuman & makanan' }
            case '/inventory/category':
                return { title: 'Kategori', subtitle: 'Kelola kategori produk' }
            case '/inventory/stock':
                return { title: 'Stok Bahan', subtitle: 'Pantau ketersediaan bahan baku' }
            case '/transactions':
                return { title: 'Laporan Transaksi', subtitle: 'Riwayat transaksi penjualan' }
            default:
                return { title: 'Masimura POS', subtitle: 'Sistem Kasir & Operasional Toko' }
        }
    }
    
    const headerInfo = getHeaderTitle()
    const [searchTerm, setSearchTerm] = useState('')

    const handleInputChange = (e) => {
        const text = e.target.value;
        setSearchTerm(text);
        if (typeof onSearch === 'function') {
            onSearch(text);
        }
    }

    const handleFilterClick = () => {
        alert('Fitur Filter ditekan! Nilai pencarian saat ini: ' + searchTerm);
    }

    return (
        <div className='bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 px-4 sm:px-6 py-2 sm:py-3 shrink-0'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                    <button className='p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors' onClick={onToggleSidebar}>
                        <Menu className='w-5 h-5'/>
                    </button>

                    <div>
                        <h1 className='text-base sm:text-xl font-black text-slate-800 dark:text-white leading-tight'>{headerInfo.title}</h1>
                        <p className='hidden sm:block text-xs text-slate-500 dark:text-slate-400'>{headerInfo.subtitle}</p>
                    </div>
                </div>

                <div className='flex items-center space-x-2 sm:space-x-3'>
                    <button
                        type="button"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={isDarkMode ? "Mode Terang" : "Mode Gelap"}
                    >
                        {isDarkMode ? (
                            <Sun className="w-4 h-4 text-amber-400" />
                        ) : (
                            <Moon className="w-4 h-4 text-slate-600" />
                        )}
                    </button>
                    
                    {currentUser && (
                        <div className='flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-700'>
                            <img src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' alt="User" className='w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 ring-blue-500'/>
                            <div className='hidden md:block'>
                                <p className='text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200'>{currentUser.nama}</p>
                                <p className='text-[10px] text-slate-500 dark:text-slate-400'>{currentUser.role}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Header