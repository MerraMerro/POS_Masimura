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
  FileText
} from 'lucide-react'
import Logo from '../../../../public/logo.jpeg'

// MenuItems disesuaikan dengan Path & Fitur Masimura POS
const menuItems = [
  {
    id: 'pos',
    icon: ShoppingBag,
    label: 'POS Kasir',
    path: '/pos',
    role: 'all', // Kasir & Admin
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
    id: 'transactions',
    icon: Receipt,
    label: 'Transactions',
    path: '/transactions',
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
    (item) => item.role === 'all' || (currentUser?.role === 'admin' && item.role === 'admin')
  )

  return (
    <div className={`${collapsed ? "w-20" : "w-72"} transition-all duration-300 ease-in-out bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col relative z-10 h-screen no-print`}>
      
      {/* Header Logo */}
      <div className='p-6 border-b border-slate-200/50 dark:border-slate-700/50'>
        <div className='flex items-center space-x-3'>
          <img src={Logo} alt="Logo" className='w-10 h-10 bg-linear-to-r rounded-xl flex items-center justify-center shadow-lg shrink-0'/>

          {!collapsed && (
            <div>
              <h1 className='text-xl font-bold text-slate-800 dark:text-white'>
                Masimura
              </h1>
              <p className='text-xs text-slate-500 dark:text-slate-400'>
                Admin Panel
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navbar List */}
      <nav className='flex-1 p-4 space-y-2 overflow-y-auto'>
        {filteredMenuItems.map((item) => {
          const isExpanded = expandedItems.has(item.id);

          return (
            <div key={item.id}>
              {item.submenu ? (
                // Menu yang memiliki Submenu (Inventory)
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  onClick={() => toggleExpanded(item.id)}
                >
                  <div className='flex items-center space-x-3'>
                    <item.icon className='w-5 h-5 shrink-0' />
                    {!collapsed && (
                      <div className="flex items-center space-x-2">
                        <span className='font-medium'>{item.label}</span>
                        {item.badge && (
                          <span className='px-2 py-0.5 text-xs bg-red-500 text-white rounded-full'>{item.badge}</span>
                        )}
                        {item.count && (
                          <span className='px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full'>{item.count}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {!collapsed && (
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  )}
                </button>
              ) : (
                // Menu Tunggal Menggunakan NavLink
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-linear-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    }`
                  }
                >
                  <div className='flex items-center space-x-3'>
                    <item.icon className='w-5 h-5 shrink-0' />
                    {!collapsed && (
                      <div className="flex items-center space-x-2">
                        <span className='font-medium'>{item.label}</span>
                        {item.badge && (
                          <span className='px-2 py-0.5 text-xs bg-emerald-500 text-white font-bold rounded-full'>{item.badge}</span>
                        )}
                        {item.count && (
                          <span className='px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full'>{item.count}</span>
                        )}
                      </div>
                    )}
                  </div>
                </NavLink>
              )}

              {/* Tampilan Submenu Menggunakan NavLink */}
              {!collapsed && item.submenu && isExpanded && (
                <div className='ml-8 mt-2 space-y-1'>
                  {item.submenu.map((subitem) => (
                    <NavLink
                      key={subitem.id}
                      to={subitem.path}
                      className={({ isActive }) =>
                        `block w-full text-left p-2 text-sm rounded-lg transition-all ${
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
      {!collapsed && currentUser && (
        <div className='p-4 border-t border-slate-200/50 dark:border-slate-700/50'>
          <div className='flex items-center space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50'>
            <div className="w-10 h-10 rounded-full bg-linear-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-blue-500">
              {currentUser.nama ? currentUser.nama.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium text-slate-800 dark:text-white truncate'>{currentUser.nama}</p>
              <p className='text-xs text-slate-500 dark:text-slate-400 truncate uppercase font-semibold'>{currentUser.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium ${
              collapsed ? 'justify-center' : 'space-x-3'
            }`}
            title="Keluar Akun"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      )}
    </div>
  )
}

export default Slidebar