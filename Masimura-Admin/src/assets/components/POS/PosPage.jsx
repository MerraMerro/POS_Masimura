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
  
  // Field Form Transaksi
  const [namaKonsumen, setNamaKonsumen] = useState('Pelanggan Umum')
  const [nominalBayar, setNominalBayar] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('tunai') // 'tunai' atau 'qris'
  const [transactionStatus, setTransactionStatus] = useState('idle') // 'idle' atau 'pending'
  
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
        
        // PERBAIKAN: Jika sisaStok undefined/kosong, anggap saja 0
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

  // --- Kelola Keranjang (DIUBAH) ---
  const addToCart = (menu) => {
    setCart((prevCart) => {
      const exist = prevCart.find((item) => item.menuId === menu._id);
      const intendedQty = exist ? exist.kuantitas + 1 : 1;

      // BLOKIR JIKA STOK TIDAK CUKUP
      if (!checkStockCapacity(menu._id, menu.resep, intendedQty, prevCart)) {
        return prevCart; // Batal masuk keranjang
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
          resep: menu.resep // Wajib menyimpan resep agar tombol + di keranjang bisa dicek
        }
      ];
    });
  }

  // --- Update Quantity di Keranjang (DIUBAH) ---
  const updateQuantity = (menuId, delta) => {
    setCart((prevCart) => {
      const exist = prevCart.find((item) => item.menuId === menuId);
      if (!exist) return prevCart;

      const newQty = exist.kuantitas + delta;

      // Jika tombol minus ditekan, izinkan langsung tanpa cek stok
      if (delta < 0) {
        if (newQty <= 0) return prevCart.filter(item => item.menuId !== menuId);
        return prevCart.map(item => item.menuId === menuId ? { ...item, kuantitas: newQty } : item);
      }

      // Jika tombol PLUS (+) ditekan, WAJIB CEK STOK
      if (!checkStockCapacity(menuId, exist.resep, newQty, prevCart)) {
        return prevCart; // Batal tambah kuantitas
      }

      return prevCart.map(item => item.menuId === menuId ? { ...item, kuantitas: newQty } : item);
    });
  }

  const removeFromCart = (menuId) => {
    setCart((prevCart) => prevCart.filter((item) => item.menuId !== menuId))
  }
  
  // --- Format & Parse Ribuan ---
  const formatRibuan = (value) => {
    if (!value) return ''
    const cleanNumber = value.toString().replace(/\D/g, '')
    return cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.') 
  }

  const parseAngka = (value) => {
    if (!value) return 0
    return Number(value.toString().replace(/\./g, ''))
  }

  // Calculated properties
  // (PERBAIKAN: Menggunakan item.harga dan item.kuantitas sesuai struktur addToCart)
  const totalHarga = cart.reduce((total, item) => total + (item.harga * item.kuantitas), 0)
  const nominalBayarAngka = parseAngka(nominalBayar)
  const kembalian = nominalBayarAngka >= totalHarga ? nominalBayarAngka - totalHarga : 0

  // --- Logika Aksi Transaksi ---
  const handleProcessTransaction = () => {
    if (cart.length === 0) return alert('Keranjang belanja masih kosong!')

    if (paymentMethod === 'tunai') {
      if (nominalBayarAngka < totalHarga) return alert('Nominal pembayaran tunai kurang!')
      handleCheckout() // Langsung proses API jika tunai valid
    } else if (paymentMethod === 'qris') {
      setNominalBayar(formatRibuan(totalHarga)) // Set nominal otomatis sesuai total tagihan
      setTransactionStatus('pending') // Pindah ke layar QRIS
    }
  }

  const handleVerifyQris = (isSuccess) => {
    if (isSuccess) {
      handleCheckout() // Uang masuk, langsung eksekusi API
    } else {
      setTransactionStatus('idle') // Batal, kembali ke keranjang
      setNominalBayar('')
    }
  }

  // --- Simpan Transaksi ke Backend ---
  const handleCheckout = async () => {
    setIsProcessing(true)
    const nomorStruk = `STRUK-${Date.now()}`
    
    // Pastikan nominal final akurat (QRIS selalu pas dengan total, Tunai sesuai input)
    const finalNominal = paymentMethod === 'qris' ? totalHarga : nominalBayarAngka;
    const finalKembalian = paymentMethod === 'qris' ? 0 : kembalian;

    const payload = {
      nomorStruk,
      namaKonsumen: namaKonsumen.trim() === '' ? 'Pelanggan Umum' : namaKonsumen,
      items: cart,
      totalHarga,
      nominalBayar: finalNominal,
      kembalian: finalKembalian,
      metodePembayaran: paymentMethod // (Opsional) Mengirim data metode bayar ke DB
    }

    try {
      const res = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.ok) {
        setLastTransaction(data.transaction) // Tampilkan modal struk
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

  // --- Reset Form Setelah Tutup Struk ---
  const resetAfterSuccess = () => {
    setLastTransaction(null)
    setCart([])
    setNominalBayar('')
    setNamaKonsumen('Pelanggan Umum')
    setTransactionStatus('idle')
    setPaymentMethod('tunai')
  }

  const filteredMenus = menus.filter((menu) => {
    const matchesSearch = menu.namaMenu.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Semua' || menu.kategori === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
      
      {/* ================= KOLOM KIRI: KATALOG MENU ================= */}
      <div className="lg:col-span-2 flex flex-col space-y-4 overflow-y-auto pr-2">
        {/* Filter Search & Kategori */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50 space-y-4 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari menu minuman/makanan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('Semua')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
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
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
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

        {/* Grid Kartu Menu */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-6">
          {filteredMenus.map((menu) => {

            // Cek isi data di Inspect Element (Console)
            console.log("Data Menu:", menu);
            
            // PERBAIKAN: Tangani nilai undefined menjadi 0
            const isHabis = menu.resep && menu.resep.some(item => {
            const stokTersedia = item.sisaStok !== undefined && item.sisaStok !== null ? Number(item.sisaStok) : 0;
            // UBAH item.jumlah MENJADI item.kuantitas
            return stokTersedia < Number(item.kuantitas); 
          });

            return (
              <div
                key={menu._id}
                onClick={() => !isHabis && addToCart(menu)}
                className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 transition-all flex flex-col justify-between ${
                  isHabis 
                    ? 'opacity-50 grayscale cursor-not-allowed' 
                    : 'hover:border-blue-500 cursor-pointer group'
                }`}
              >
                <div className="w-full h-28 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 relative">
                  
                  {/* Badge Label "HABIS" jika stok kosong */}
                  {isHabis && (
                    <div className="absolute inset-0 bg-slate-900/40 z-10 flex items-center justify-center backdrop-blur-sm">
                      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        BAHAN HABIS
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                    {menu.kategori}
                  </span>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">
                    {menu.namaMenu}
                  </h4>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      Rp {menu.harga?.toLocaleString('id-ID')}
                    </span>
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isHabis 
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-400' 
                        : 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white'
                    }`}>
                      <Plus className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ================= KOLOM KANAN: PANEL TRANSAKSI ================= */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 flex flex-col justify-between h-full shrink-0 shadow-sm">
        
        {/* === TAMPILAN IDLE (KERANJANG & INPUT) === */}
        {transactionStatus === 'idle' && (
          <>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-500" />
                  Pesanan Aktif
                </h3>
                <span className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold">
                  {cart.reduce((a, b) => a + b.kuantitas, 0)} Item
                </span>
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5" /> Nama Konsumen
                </label>
                <input
                  type="text"
                  placeholder="Pelanggan Umum"
                  value={namaKonsumen}
                  onChange={(e) => setNamaKonsumen(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1 pb-4">
                {cart.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-8">Keranjang belanja kosong</p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.menuId}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50"
                    >
                      <div className="flex-1 pr-2">
                        <h5 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">
                          {item.namaMenu}
                        </h5>
                        <span className="text-[11px] text-emerald-600 font-semibold">
                          Rp {(item.harga * item.kuantitas).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.menuId, -1)}
                          className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-5 text-center text-slate-800 dark:text-white">
                          {item.kuantitas}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.menuId, 1)}
                          className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.menuId)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg ml-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3 shrink-0 mt-4">
              {/* Tombol Pemilihan Metode Pembayaran */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button 
                  onClick={() => setPaymentMethod('tunai')}
                  className={`flex items-center justify-center space-x-2 py-2 rounded-xl text-sm font-semibold transition-all ${
                    paymentMethod === 'tunai' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Tunai</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('qris')}
                  className={`flex items-center justify-center space-x-2 py-2 rounded-xl text-sm font-semibold transition-all ${
                    paymentMethod === 'qris' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>QRIS</span>
                </button>
              </div>

              {/* Form Input Khusus Tunai */}
              {paymentMethod === 'tunai' && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Nominal Bayar (Rp)
                  </label>
                  <input
                    type="text"
                    placeholder="0"
                    value={nominalBayar}
                    onChange={(e) => setNominalBayar(formatRibuan(e.target.value))}
                    className="w-full mt-1 p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white font-bold tracking-wide"
                  />
                  <div className="flex justify-between text-xs font-medium pt-2">
                    <span className="text-slate-500 dark:text-slate-400">Kembalian</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      Rp {kembalian.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-sm font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Total Harga</span>
                <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                  Rp {totalHarga.toLocaleString('id-ID')}
                </span>
              </div>

              <button
                onClick={handleProcessTransaction}
                disabled={cart.length === 0}
                className="w-full py-3 mt-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:opacity-95 transition-all text-sm disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Buat Pesanan</span>
              </button>
            </div>
          </>
        )}

        {/* === TAMPILAN PENDING (QRIS) === */}
        {transactionStatus === 'pending' && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 text-center animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center animate-pulse">
              <Clock className="w-10 h-10" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Menunggu Pembayaran
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 px-4">
                Arahkan pelanggan untuk scan QRIS DANA senilai <br/>
                <span className="font-bold text-blue-500 text-lg tracking-wide">Rp {totalHarga.toLocaleString('id-ID')}</span>
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border-2 border-dashed border-slate-200">
              <img src="../public/qr_pembayaran.jpeg" alt="qris" className='w-32 h-32'/>
            </div>

            <div className="w-full space-y-3 mt-auto pt-6">
              <button 
                onClick={() => handleVerifyQris(true)}
                disabled={isProcessing}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/25"
              >
                {isProcessing ? (
                  <span>Memproses...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Uang Sudah Masuk (Sukses)</span>
                  </>
                )}
              </button>
              
              <button 
                onClick={() => handleVerifyQris(false)}
                disabled={isProcessing}
                className="w-full bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition-all"
              >
                <XCircle className="w-5 h-5" />
                <span>Batalkan Pesanan</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ================= MODAL STRUK ================= */}
      {lastTransaction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body > *:not(#print-area-wrapper) {
                display: none !important;
              }
              #nota-cetak {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 80mm !important;
                padding: 5mm !important;
                margin: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                box-shadow: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />

          {/* Kotak Struk */}
          <div id="nota-cetak" className="bg-white text-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl relative animate-in zoom-in duration-200">
            <button
              onClick={resetAfterSuccess}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 no-print"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center border-b pb-3 border-slate-200">
              <h3 className="text-xl font-extrabold tracking-wider text-slate-900">MASIMURA POS</h3>
              <p className="text-xs text-slate-500">Struk Pembayaran Konsumen</p>
              <div className="text-[11px] text-slate-400 mt-2 space-y-0.5">
                <p>No: <span className="font-semibold">{lastTransaction.nomorStruk}</span></p>
                <p>Konsumen: <span className="font-semibold">{lastTransaction.namaKonsumen}</span></p>
                <p>{new Date(lastTransaction.waktuTransaksi || lastTransaction.createdAt).toLocaleString('id-ID')}</p>
                <p>Metode: <span className="font-semibold uppercase">{lastTransaction.metodePembayaran || paymentMethod}</span></p>
              </div>
            </div>

            <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
              {lastTransaction.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-800">{item.namaMenu}</p>
                    <p className="text-[10px] text-slate-400">
                      {item.kuantitas} x Rp {item.harga?.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className="font-bold text-slate-800">
                    Rp {(item.harga * item.kuantitas).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-300 pt-3 text-xs space-y-1">
              <div className="flex justify-between font-extrabold text-sm text-slate-900">
                <span>Total:</span>
                <span>Rp {lastTransaction.totalHarga?.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Nominal Bayar:</span>
                <span>Rp {lastTransaction.nominalBayar?.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Kembalian:</span>
                <span>Rp {lastTransaction.kembalian?.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Nota</span>
              </button>
              <button
                onClick={resetAfterSuccess}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200"
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