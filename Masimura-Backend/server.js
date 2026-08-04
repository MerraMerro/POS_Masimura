const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

// --- Middleware ---
app.use(cors({ 
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    allowedHeaders: ['Content-Type'] 
}));
app.use(express.json());

// --- Konfigurasi Cloudinary ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Konfigurasi Storage Multer ke Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'masimura_pos',
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'avif'],
    public_id: (req, file) => `${Date.now()}-${file.originalname.split('.')[0]}`
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// --- Import Models ---
const User = require('./models/User');
const Menu = require('./models/Menu');
const Stock = require('./models/Stock');
const Transaction = require('./models/Transactions');
const Category = require('./models/Category');
const Employee = require('./models/Employee');
const Promo = require('./models/Promo');

// --- Import & Gunakan Routes Terpisah ---
const stockRoutes = require('./routes/stockRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const promoRoutes = require('./routes/promoRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/stocks', stockRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/users', userRoutes);

// --- API UPLOAD GAMBAR KE CLOUDINARY ---
app.post('/api/upload', upload.single('gambar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diunggah' });
    }
    // Mengembalikan URL publik permanen dari Cloudinary
    res.json({ imageUrl: req.file.path });
  } catch (err) {
    console.error("Error Upload Cloudinary:", err);
    res.status(500).json({ message: err.message });
  }
});

// --- API LOGIN ---
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah!' });
    }

    res.json({
      _id: user._id,
      username: user.username,
      nama: user.nama,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Seed User Default ---
async function seedUsers() {
  const count = await User.countDocuments();
  if (count === 0) {
    await User.insertMany([
      { username: 'admin', password: 'admin123', nama: 'Administrator', role: 'admin' },
      { username: 'kasir', password: 'kasir123', nama: 'Kasir Masimura', role: 'kasir' }
    ]);
    console.log("🌱 Default User (Admin & Kasir) berhasil dibuat!");
  }
}

// --- API CRUD KATEGORI ---
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { namaKategori, deskripsi } = req.body;
    const existing = await Category.findOne({ namaKategori });
    if (existing) {
      return res.status(400).json({ message: 'Kategori sudah ada' });
    }
    const newCategory = new Category({ namaKategori, deskripsi });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch(err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) =>{
  try {
    const updateCategory = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updateCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- API CRUD MENU ---
app.get('/api/menus', async (req, res) => {
  try {
    const menus = await Menu.find().lean();
    const stocks = await Stock.find().lean();

    const menusWithStock = menus.map(menu => {
      if (menu.resep && menu.resep.length > 0) {
        menu.resep = menu.resep.map(bahanResep => {
          const matchingStock = stocks.find(s => 
            s._id.toString() === bahanResep.stockId?.toString() || 
            s.namaBahan === bahanResep.namaBahan
          );
          
          return {
            ...bahanResep,
            sisaStok: matchingStock ? matchingStock.sisaStok : 0 
          };
        });
      }
      return menu;
    });

    res.json(menusWithStock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/menus', async (req, res) => {
  try {
    const newMenu = new Menu(req.body);
    await newMenu.save();
    res.status(201).json(newMenu);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/menus/:id', async (req, res) => {
  try {
    const updatedMenu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedMenu);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/menus/:id', async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
    res.json({ message: 'Menu berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- API DASHBOARD STATS ---
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const transactions = await Transaction.find({ statusTransaksi: 'Selesai' });
    const stocks = await Stock.find();
    const totalProducts = await Menu.countDocuments();

    const totalRevenue = transactions.reduce((sum, trx) => sum + (trx.totalHarga || 0), 0);
    const lowStockCount = stocks.filter(s => (s.sisaStok || 0) <= 5).length;

    res.json({
      totalRevenue: totalRevenue || 0,
      totalOrders: transactions.length || 0,
      totalProducts: totalProducts || 0,
      lowStockCount: lowStockCount || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Endpoint Chart Analytics Dashboard ---
app.get('/api/dashboard/analytics', async (req, res) => {
  try {
    const transactions = await Transaction.find({ statusTransaksi: 'Selesai' });

    const monthlyRevenue = Array(12).fill(0);
    const currentYear = new Date().getFullYear();

    transactions.forEach(trx => {
      const transactionDate = trx.waktuTransaksi || trx.createdAt;
      if (transactionDate) {
        const dateObj = new Date(transactionDate);
        if (dateObj.getFullYear() === currentYear) {
          const monthIndex = dateObj.getMonth();
          monthlyRevenue[monthIndex] += (trx.totalHarga || 0);
        }
      }
    });

    const menus = await Menu.find();
    const kamusKategori = {};
    menus.forEach(m => {
      kamusKategori[m.namaMenu] = m.kategori;
    });

    const categories = await Category.find();
    const categoryCounts = {};
    categories.forEach(cat => { categoryCounts[cat.namaKategori] = 0; });
    
    transactions.forEach(trx => {
      if (Array.isArray(trx.items)) {
        trx.items.forEach(item => {
          const cat = item.kategori || kamusKategori[item.namaMenu] || 'Lainnya';  
          categoryCounts[cat] = (categoryCounts[cat] || 0) + (Number(item.kuantitas) || 1);
        });
      }
    });

    const totalItemsSold = Object.values(categoryCounts).reduce((a, b) => a + b, 0) || 1;
    const categoryDistribution = Object.keys(categoryCounts).map(cat => ({
      name: cat,
      count: categoryCounts[cat],
      percentage: Math.round((categoryCounts[cat] / totalItemsSold) * 100)
    }));

    res.json({
      monthlyRevenue,
      categoryDistribution
    });
  } catch (err) {
    console.error("Error Dashboard Analytics:", err);
    res.status(500).json({ message: err.message });
  }
});

// --- API CRUD KARYAWAN & GAJI ---
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const newEmployee = new Employee(req.body);
    await newEmployee.save();
    res.status(201).json(newEmployee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedEmployee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Karyawan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Root Test Endpoint ---
app.get('/', (req, res) => {
    res.send('API Masimura POS Berjalan!');
});

// --- Database Connection & Server Listener ---
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, clientOptions);
    console.log("Terhubung ke MongoDB Atlas!");

    await seedUsers(); 

    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany([
        { namaKategori: 'East Side', deskripsi: 'Hidangan makanan khas timur' },
        { namaKategori: 'West Side', deskripsi: 'Hidangan makanan khas barat' },
        { namaKategori: 'Drinks', deskripsi: 'Minuman segar dan Kopi' }
      ]);
      console.log("🌱 Default Category berhasil dibuat!");
    }
  } catch (err) {
    console.error("Gagal terhubung:", err.message);
  }
}

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server Back-end berjalan di http://localhost:${PORT}`);
});