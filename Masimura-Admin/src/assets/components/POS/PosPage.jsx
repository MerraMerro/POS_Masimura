import React, { useState, useEffect } from 'react'
import { 
  Search, ShoppingBag, Plus, Minus, Trash2, 
  CreditCard, Printer, User, X, Banknote, 
  QrCode, Clock, CheckCircle2, XCircle 
} from 'lucide-react'
import { API_URL } from '../../../config/api'

export default function PosPage() {
  const [menus, setMenus] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState([])
  
  // State untuk tab mobile (hanya aktif di layar portrait kecil)
  const [activeTabMobile, setActiveTabMobile] = useState('menu') 
  
  // Field Form Transaksi
  const [namaKonsumen, setNamaKonsumen] = useState('Pelanggan Umum')
  const [nominalBayar, setNominalBayar] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('tunai') 
  const [transactionStatus, setTransactionStatus] = useState('idle') 
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastTransaction, setLastTransaction] = useState(null) 

  useEffect(() => {
    fetchMenus()
    fetchCategories()
  }, [])

  const fetchMenus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/menus`)
      const data = await res.json()
      setMenus(data)
    } catch (err) {
      console.error('Gagal mengambil menu:', err)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`)
      const data = await res.json()
      setCategories(data)
    } catch (err) {
      console.error('Gagal mengambil kategori:', err)
    }
  }

  // --- Pengecekan Stok Global di Keranjang ---
  const checkStockCapacity = (targetMenuId, targetResep, intendedQty, currentCart) => {
    const usageMap = {};
    currentCart.forEach(item => {
      if (item.menuId !== targetMenuId && item.resep) {
        item.resep.forEach(b => {
          usageMap[b.namaBahan] = (usageMap[b.namaBahan] || 0) + (Number(b.kuantitas) * item.kuantitas);
        });
      }
    });

    let isSafe = true;
    let namaBahanKurang = [];

    if (targetResep && targetResep.length > 0) {
      targetResep.forEach(b => {
        const totalDibutuhkan = (usageMap[b.namaBahan] || 0) + (Number(b.kuantitas) * intendedQty);
        const stokTersedia = b.sisaStok !== undefined && b.sisaStok !== null ? Number(b.sisaStok) : 0;
        
        if (totalDibutuhkan > stokTersedia) {
          isSafe = false;
          if (!namaBahanKurang.includes(b.namaBahan)) {
            namaBahanKurang.push(b.namaBahan);
          }
        }
      });
    }

    if (!isSafe) {
      alert(`Batas maksimal! Stok tidak cukup untuk bahan: ${namaBahanKurang.join(', ')}`);
      return false;
    }

    return true;
  }

  const addToCart = (menu) => {
    setCart((prevCart) => {
      const exist = prevCart.find((item) => item.menuId === menu._id);
      const intendedQty = exist ? exist.kuantitas + 1 : 1;

      if (!checkStockCapacity(menu._id, menu.resep, intendedQty, prevCart)) {
        return prevCart;
      }

      if (exist) {
        return prevCart.map((item) =>
          item.menuId === menu._id ? { ...item, kuantitas: intendedQty } : item
        );
      }

      return [
        ...prevCart,
        {
          menuId: menu._id,
          namaMenu: menu.namaMenu,
          kategori: menu.kategori,
          harga: menu.harga,
          kuantitas: 1,
          resep: menu.resep
        }
      ];
    });
  }

  const updateQuantity = (menuId, delta) => {
    setCart((prevCart) => {
      const exist = prevCart.find((item) => item.menuId === menuId);
      if (!exist) return prevCart;

      const newQty = exist.kuantitas + delta;

      if (delta < 0) {
        if (newQty <= 0) return prevCart.filter(item => item.menuId !== menuId);
        return prevCart.map(item => item.menuId === menuId ? { ...item, kuantitas: newQty } : item);
      }

      if (!checkStockCapacity(menuId, exist.resep, newQty, prevCart)) {
        return prevCart;
      }

      return prevCart.map(item => item.menuId === menuId ? { ...item, kuantitas: newQty } : item);
    });
  }

  const removeFromCart = (menuId) => {
    setCart((prevCart) => prevCart.filter((item) => item.menuId !== menuId))
  }
  
  const formatRibuan = (value) => {
    if (!value) return ''
    const cleanNumber = value.toString().replace(/\D/g, '')
    return cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.') 
  }

  const parseAngka = (value) => {
    if (!value) return 0
    return Number(value.toString().replace(/\./g, ''))
  }

  const totalHarga = cart.reduce((total, item) => total + (item.harga * item.kuantitas), 0)
  const totalItemCount = cart.reduce((a, b) => a + b.kuantitas, 0)
  const nominalBayarAngka = parseAngka(nominalBayar)
  const kembalian = nominalBayarAngka >= totalHarga ? nominalBayarAngka - totalHarga : 0

  const handleProcessTransaction = () => {
    if (cart.length === 0) return alert('Keranjang belanja masih kosong!')

    if (paymentMethod === 'tunai') {
      if (nominalBayarAngka < totalHarga) return alert('Nominal pembayaran tunai kurang!')
      handleCheckout() 
    } else if (paymentMethod === 'qris') {
      setNominalBayar(formatRibuan(totalHarga)) 
      setTransactionStatus('pending') 
    }
  }

  const handleVerifyQris = (isSuccess) => {
    if (isSuccess) {
      handleCheckout() 
    } else {
      setTransactionStatus('idle') 
      setNominalBayar('')
    }
  }

  const handleCheckout = async () => {
    setIsProcessing(true)
    const nomorStruk = `STRUK-${Date.now()}`
    
    const finalNominal = paymentMethod === 'qris' ? totalHarga : nominalBayarAngka;
    const finalKembalian = paymentMethod === 'qris' ? 0 : kembalian;

    const payload = {
      nomorStruk,
      namaKonsumen: namaKonsumen.trim() === '' ? 'Pelanggan Umum' : namaKonsumen,
      items: cart,
      totalHarga,
      nominalBayar: finalNominal,
      kembalian: finalKembalian,
      metodePembayaran: paymentMethod
    }

    try {
      const res = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.ok) {
        setLastTransaction(data.transaction) 
      } else {
        alert(data.message || 'Gagal memproses transaksi')
      }
    } catch (err) {
      console.error('Error Checkout:', err)
      alert('Terjadi kesalahan koneksi server')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetAfterSuccess = () => {
    setLastTransaction(null)
    setCart([])
    setNominalBayar('')
    setNamaKonsumen('Pelanggan Umum')
    setTransactionStatus('idle')
    setPaymentMethod('tunai')
    setActiveTabMobile('menu')
  }

  const filteredMenus = menus.filter((menu) => {
    const matchesSearch = menu.namaMenu.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Semua' || menu.kategori === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="h-full min-h-0 flex flex-col lg:grid lg:grid-cols-3 lg:gap-6 overflow-hidden">
      
      {/* ================= TOMBOL NAVIGASI MOBILE (Hanya tampil di HP posisi potret) ================= */}
      <div className="lg:hidden landscape:hidden flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2 shrink-0 z-10 sticky top-0 shadow-sm">
        <button
          onClick={() => setActiveTabMobile('menu')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTabMobile === 'menu'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Katalog Menu
        </button>
        <button
          onClick={() => setActiveTabMobile('cart')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all relative flex items-center justify-center gap-1.5 ${
            activeTabMobile === 'cart'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Keranjang</span>
          {totalItemCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {totalItemCount}
            </span>
          )}
        </button>
      </div>

      {/* ================= KOLOM KIRI: KATALOG MENU ================= */}
      <div className={`lg:col-span-2 flex flex-col space-y-4 overflow-y-auto pr-0 lg:pr-2 h-full ${
        activeTabMobile === 'menu' ? 'flex' : 'hidden lg:flex landscape:flex'
      }`}>
        <div className="bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-slate-200/50 dark:border-slate-700/50 space-y-3 shrink-0 shadow-sm">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari menu makanan/minuman..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('Semua')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'Semua'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat.namaKategori)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.namaKategori
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat.namaKategori}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Menu Responsif (3 kolom di landscape/laptop, 2 kolom di portrait) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 landscape:grid-cols-3 gap-3 pb-6">
          {filteredMenus.map((menu) => {
            const isHabis = menu.resep && menu.resep.some(item => {
              const stokTersedia = item.sisaStok !== undefined && item.sisaStok !== null ? Number(item.sisaStok) : 0;
              return stokTersedia < Number(item.kuantitas); 
            });

            return (
              <div
                key={menu._id}
                onClick={() => !isHabis && addToCart(menu)}
                className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-3 transition-all flex flex-col justify-between shadow-sm ${
                  isHabis 
                    ? 'opacity-50 grayscale cursor-not-allowed' 
                    : 'hover:border-blue-500 cursor-pointer group active:scale-95'
                }`}
              >
                <div className="w-full h-20 sm:h-24 landscape:h-20 bg-slate-100 dark:bg-slate-800 rounded-xl mb-2 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 relative">
                  {isHabis && (
                    <div className="absolute inset-0 bg-slate-900/40 z-10 flex items-center justify-center backdrop-blur-sm">
                      <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        HABIS
                      </span>
                    </div>
                  )}

                  <img
                    src={
                      menu.gambar && menu.gambar.trim() !== ''
                        ? menu.gambar
                        : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'
                    }
                    alt={menu.namaMenu}
                    className={`w-full h-full object-cover transition-transform duration-300 ${!isHabis && 'group-hover:scale-105'}`}
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'
                    }}
                  />
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500">
                    {menu.kategori}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">
                    {menu.namaMenu}
                  </h4>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      Rp {menu.harga?.toLocaleString('id-ID')}
                    </span>
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      isHabis 
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-400' 
                        : 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white'
                    }`}>
                      <Plus className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ================= KOLOM KANAN: PANEL KERANJANG & PEMBAYARAN ================= */}
      <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-3 sm:p-4 flex flex-col justify-between h-full shadow-sm overflow-hidden ${
        activeTabMobile === 'cart' ? 'flex flex-col flex-1' : 'hidden lg:flex landscape:flex'
      }`}>
        
        {transactionStatus === 'idle' && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-2 shrink-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-blue-500" />
                Pesanan Aktif
              </h3>
              <span className="text-[11px] bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                {totalItemCount} Item
              </span>
            </div>

            <div className="mb-2 shrink-0">
              <input
                type="text"
                placeholder="Nama Konsumen"
                value={namaKonsumen}
                onChange={(e) => setNamaKonsumen(e.target.value)}
                className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Daftar Item Keranjang (Dapat di-scroll jika panjang) */}
            <div className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-[80px] max-h-[140px] landscape:max-h-[100px] sm:max-h-none">
              {cart.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">Keranjang kosong</p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.menuId}
                    className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50"
                  >
                    <div className="flex-1 pr-1">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">
                        {item.namaMenu}
                      </h5>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Rp {(item.harga * item.kuantitas).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => updateQuantity(item.menuId, -1)}
                        className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center text-slate-800 dark:text-white">
                        {item.kuantitas}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.menuId, 1)}
                        className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.menuId)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-md ml-0.5"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bagian Pembayaran di Bawah */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 space-y-2 shrink-0 mt-2">
              <div className="grid grid-cols-2 gap-1.5">
                <button 
                  onClick={() => setPaymentMethod('tunai')}
                  className={`py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                    paymentMethod === 'tunai' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Tunai</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('qris')}
                  className={`py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                    paymentMethod === 'qris' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QRIS</span>
                </button>
              </div>

              {paymentMethod === 'tunai' && (
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="Nominal Bayar (Rp)"
                    value={nominalBayar}
                    onChange={(e) => setNominalBayar(formatRibuan(e.target.value))}
                    className="w-full p-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-bold"
                  />
                  <div className="flex justify-between text-[11px] font-medium px-1">
                    <span className="text-slate-500">Kembalian:</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      Rp {kembalian.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-xs font-medium pt-1 border-t border-slate-100 dark:border-slate-800 px-1">
                <span className="text-slate-500 font-bold">Total:</span>
                <span className="text-sm sm:text-base font-extrabold text-blue-600 dark:text-blue-400">
                  Rp {totalHarga.toLocaleString('id-ID')}
                </span>
              </div>

              <button
                onClick={handleProcessTransaction}
                disabled={cart.length === 0}
                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 transition-all text-xs disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Buat Pesanan ({totalItemCount})</span>
              </button>
            </div>
          </div>
        )}

        {transactionStatus === 'pending' && (
          <div className="flex flex-col items-center justify-center h-full space-y-3 text-center py-2">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center animate-pulse">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Menunggu QRIS</h3>
              <p className="text-[11px] text-slate-500 font-bold text-blue-500">
                Rp {totalHarga.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="p-2 bg-white rounded-xl border border-slate-200">
              <img src="/qr_pembayaran.jpeg" alt="qris" className='w-24 h-24 mx-auto'/>
            </div>
            <div className="w-full space-y-1.5 mt-auto">
              <button 
                onClick={() => handleVerifyQris(true)}
                disabled={isProcessing}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Memproses...' : 'Uang Masuk (Sukses)'}</span>
              </button>
              <button 
                onClick={() => handleVerifyQris(false)}
                disabled={isProcessing}
                className="w-full bg-red-100 text-red-600 font-bold py-1.5 rounded-xl text-xs"
              >
                Batalkan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL STRUK ================= */}
      {lastTransaction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div id="nota-cetak" className="bg-white text-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-2xl relative">
            <button
              onClick={resetAfterSuccess}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 no-print"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center border-b pb-2 border-slate-200">
              <h3 className="text-lg font-extrabold tracking-wider text-slate-900">MASIMURA POS</h3>
              <p className="text-[11px] text-slate-500">Struk Pembayaran Konsumen</p>
              <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                <p>No: <span className="font-semibold">{lastTransaction.nomorStruk}</span></p>
                <p>Konsumen: <span className="font-semibold">{lastTransaction.namaKonsumen}</span></p>
                <p>{new Date(lastTransaction.waktuTransaksi || lastTransaction.createdAt).toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs max-h-36 overflow-y-auto pr-1">
              {lastTransaction.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-800">{item.namaMenu}</p>
                    <p className="text-[10px] text-slate-400">{item.kuantitas} x Rp {item.harga?.toLocaleString('id-ID')}</p>
                  </div>
                  <span className="font-bold text-slate-800">
                    Rp {(item.harga * item.kuantitas).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-300 pt-2 text-xs space-y-1">
              <div className="flex justify-between font-extrabold text-sm text-slate-900">
                <span>Total:</span>
                <span>Rp {lastTransaction.totalHarga?.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Bayar:</span>
                <span>Rp {lastTransaction.nominalBayar?.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Kembalian:</span>
                <span>Rp {lastTransaction.kembalian?.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Nota</span>
              </button>
              <button
                onClick={resetAfterSuccess}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}