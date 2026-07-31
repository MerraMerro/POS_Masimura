import { Bell, ChevronDown, Filter, Menu, Search, Settings, Sun, Moon } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom' 
import ProfileImg from '../../../../public/qr_pembayaran.jpeg'

function Header({ sideBarCollapsed, onToggleSidebar, onSearch }) {
    
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
        <div className='bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-4'>
                    <button className='p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors' onClick={onToggleSidebar}>
                        <Menu className='w-5 h-5'/>
                    </button>

                    <div className='hidden md:block'>
                        <h1 className='text-2xl font-black text-slate-800 dark:text-white'>{headerInfo.title}</h1>
                        <p className=' text-slate-800 dark:text-white'>{headerInfo.subtitle}</p>
                    </div>
                </div>

                <div className='flex-1 max-w-md mx-8'>
                    <div className='relative'>
                        <Search className='w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400'/>
                        <input 
                            type="text" 
                            placeholder='Search Anything' 
                            value={searchTerm} 
                            onChange={handleInputChange} 
                            className='w-full pl-10 pr-10 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                        />
                        
                        <button 
                            onClick={handleFilterClick} 
                            className='absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors rounded-lg'
                            title="Filter Pencarian"
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className='flex items-center space-x-3'>
                    <button
                        type="button"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={isDarkMode ? "Ubah ke Mode Terang" : "Ubah ke Mode Gelap"}
                        >
                        {isDarkMode ? (
                            <Sun className="w-5 h-5 text-amber-400" />
                        ) : (
                            <Moon className="w-5 h-5 text-slate-600" />
                        )}
                    </button>

                    <div className='flex items-center space-x-3 pl-3 border-l border-slate-200 dark:border-slate-700'>
                        <img src={ProfileImg} alt="User" className='w-8 h-8 rounded-full ring-2 ring-blue-500'/>
                        <div className='hidden md:block'>
                            <p className='text-sm font-medium text-slate-500 dark:text-slate-400'>John Doe</p>
                            <p className='text-xs text-slate-500 dark:text-slate-400'>Admin</p>
                        </div>
                        <ChevronDown className='w-4 h-4 text-slate-400'/>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Header