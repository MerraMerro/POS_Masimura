import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
    ChevronDown, 
    CreditCard, 
    LayoutDashboard,
    LogOut, 
    Package, 
    ShoppingBag, 
    Utensils, 
    Tags,
    Receipt,
    Zap, 
    User,
    FileText,
    Settings,
    PercentIcon,
    History
} from 'lucide-react'
import Logo from '../../../../public/logo.jpeg'

// MenuItems disesuaikan dengan Path & Fitur Masimura POS
const menuItems = [
    {
        id: 'pos',
        icon: ShoppingBag,
        label: 'POS Kasir',
        path: '/pos',
        role: 'kasir',
        badge: 'Live',
    },
    {
        id: 'dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
        path: '/dashboard',
        role: 'admin',
    },
    {
        id: 'inventory',
        icon: Package,
        label: 'Inventory',
        path: '/inventory',
        role: 'admin',
        submenu: [
            { id: 'menu', label: 'Menu Makanan', path: '/inventory/menu' },
            { id: 'category', label: 'Kategori', path: '/inventory/category' },
            { id: 'stock', label: 'Stok Bahan', path: '/inventory/stock' }
        ],
    },
    {
        id: 'promotion',
        icon: PercentIcon,
        label: 'Promotion',
        path: '/promotion',
        role: 'admin',
    },
    {
        id: 'transactions',
        icon: Receipt,
        label: 'Transactions',
        path: '/transactions',
        role: 'admin',
    },
    {
        id: 'history',
        icon: History,
        label: 'History',
        path: '/import',
        role: 'admin',
    },
    {
        id: 'employee',
        icon: User,
        label: 'Employee',
        path: '/employee',
        role: 'admin',
    },
    {
        id: 'reporting',
        icon: FileText,
        label: 'Reporting',
        path: '/reporting',
        role: 'admin',
    },
    {
        id: 'settings',
        icon: Settings,
        label: 'Setting',
        path: '/setting',
        role: 'admin',
    },
];

function Slidebar({ collapsed, currentUser, onLogout }) {
    const [expandedItems, setExpandedItems] = useState(new Set(["inventory"]))

    const toggleExpanded = (itemid) => {
        const newExpanded = new Set(expandedItems)

        if (newExpanded.has(itemid)) {
            newExpanded.delete(itemid)
        } else {
            newExpanded.add(itemid)
        }

        setExpandedItems(newExpanded)
    }

    // Filter menu sesuai role pengguna (Kasir hanya melihat POS Kasir)
    const filteredMenuItems = menuItems.filter(
        (item) => item.role === 'kasir' || (currentUser?.role === 'admin' && item.role === 'admin')
    )

    return (
        <div className={`
            ${collapsed ? "w-0 sm:w-20 border-r-0 sm:border-r" : "w-64 sm:w-72 border-r"} 
            transition-all duration-300 ease-in-out 
            bg-white/90 dark:bg-slate-900/90 sm:bg-white/80 sm:dark:bg-slate-900/80 backdrop-blur-xl 
            border-slate-200/50 dark:border-slate-700/50 
            flex flex-col relative z-20 h-screen no-print shrink-0 overflow-hidden
        `}>
            
            {/* Header Logo */}
            <div className={`border-b border-slate-200/50 dark:border-slate-700/50 transition-all ${collapsed ? 'p-3 sm:p-4' : 'p-4 sm:p-6'}`}>
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
                    <img 
                        src={Logo} 
                        alt="Logo" 
                        className={`bg-linear-to-r rounded-xl flex items-center justify-center shadow-lg shrink-0 transition-all ${collapsed ? 'w-8 h-8' : 'w-9 h-9 sm:w-10 sm:h-10'}`}
                    />

                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <h1 className='text-lg sm:text-xl font-bold text-slate-800 dark:text-white truncate'>
                                Masimura
                            </h1>
                            <p className='text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate'>
                                Admin Panel
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navbar List */}
            <nav className='flex-1 p-2 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto scrollbar-none'>
                {filteredMenuItems.map((item) => {
                    const isExpanded = expandedItems.has(item.id);

                    return (
                        <div key={item.id}>
                            {item.submenu ? (
                                // Menu yang memiliki Submenu (Inventory)
                                <button
                                    type="button"
                                    title={collapsed ? item.label : undefined}
                                    className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                    onClick={() => toggleExpanded(item.id)}
                                >
                                    <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'space-x-2.5 sm:space-x-3'}`}>
                                        <item.icon className='w-4 h-4 sm:w-5 sm:h-5 shrink-0' />
                                        {!collapsed && (
                                            <div className="flex items-center space-x-2">
                                                <span className='text-sm font-medium'>{item.label}</span>
                                                {item.badge && (
                                                    <span className='px-2 py-0.5 text-[10px] sm:text-xs bg-red-500 text-white rounded-full'>{item.badge}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {!collapsed && (
                                        <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                    )}
                                </button>
                            ) : (
                                // Menu Tunggal Menggunakan NavLink
                                <NavLink
                                    to={item.path}
                                    title={collapsed ? item.label : undefined}
                                    className={({ isActive }) =>
                                        `w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all duration-200 ${
                                            isActive
                                                ? "bg-linear-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 font-semibold"
                                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                        }`
                                    }
                                >
                                    <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'space-x-2.5 sm:space-x-3'}`}>
                                        <item.icon className='w-4 h-4 sm:w-5 sm:h-5 shrink-0' />
                                        {!collapsed && (
                                            <div className="flex items-center space-x-2">
                                                <span className='text-sm font-medium'>{item.label}</span>
                                                {item.badge && (
                                                    <span className='px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-emerald-500 text-white font-bold rounded-full'>{item.badge}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </NavLink>
                            )}

                            {/* Tampilan Submenu Menggunakan NavLink */}
                            {!collapsed && item.submenu && isExpanded && (
                                <div className='ml-7 sm:ml-8 mt-1 sm:mt-2 space-y-1'>
                                    {item.submenu.map((subitem) => (
                                        <NavLink
                                            key={subitem.id}
                                            to={subitem.path}
                                            className={({ isActive }) =>
                                                `block w-full text-left p-2 text-[11px] sm:text-sm rounded-lg transition-all ${
                                                    isActive
                                                        ? "text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-slate-800"
                                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                                                }`
                                            }
                                        >
                                            {subitem.label}
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Profile Footer */}
            {currentUser && (
                <div className='p-3 sm:p-4 border-t border-slate-200/50 dark:border-slate-700/50'>
                    {!collapsed && (
                        <div className='flex items-center space-x-2.5 sm:space-x-3 p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 mb-2 sm:mb-3'>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-linear-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm ring-2 ring-blue-500 shrink-0">
                                {currentUser.nama ? currentUser.nama.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div className='flex-1 min-w-0'>
                                <p className='text-xs sm:text-sm font-medium text-slate-800 dark:text-white truncate'>{currentUser.nama}</p>
                                <p className='text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate uppercase font-semibold'>{currentUser.role}</p>
                            </div>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={onLogout}
                        className={`w-full flex items-center p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium ${
                            collapsed ? 'justify-center' : 'space-x-2 sm:space-x-3'
                        }`}
                        title="Keluar Akun"
                    >
                        <LogOut className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                        {!collapsed && <span className="text-sm">Keluar</span>}
                    </button>
                </div>
            )}
        </div>
    )
}

export default Slidebar