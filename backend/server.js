const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

dotenv.config();

// --- Inline User Model (avoids relative path issues in serverless) ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const app = express();


// --- CORS: allow env-configured origin (or any in dev) ---
const allowedOrigin = process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.trim() : true;
app.use(cors({
  origin: allowedOrigin,

  credentials: true,
}));
app.use(express.json());

// --- Serverless-safe MongoDB connection (cached) ---
let cachedConnection = null;
const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }
  // Trim to remove any trailing whitespace/newlines from env var
  const uri = (process.env.MONGO_URI || '').trim();
  cachedConnection = await mongoose.connect(uri);
  console.log('✅ MongoDB connected');
  return cachedConnection;
};
connectDB().catch(err => console.error('❌ MongoDB Error:', err));



// ==========================================
//  SCHEMAS
// ==========================================

// 1. Customer Schema (CRM)
const CustomerSchema = new mongoose.Schema({
  generatedId: { type: String, required: true, unique: true },
  personal: {
    title: String,
    firstName: String,
    lastName: String,
    fatherName: String,
    mobile: String,
    email: String,
  },
  address: {
    village: String,
    district: String,
    postOffice: String,
    policeStation: String,
    pincode: String,
  },
  pipeline: {
    created: { type: Boolean, default: true },
    challan: { type: Boolean, default: false },
    agreement: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now }
});
const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);

// 2. Challan Schema
const ChallanSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  details: {
    challanNo: String,
    challanDate: Date,
    model: String,
    dto: String,
    make: String,
    color: String,
  },
  registration: {
    productNo: String,
    bookNo: String,
    keyNo: String,
    batteryNo: String,
  },
  engine: {
    frameNo: String,
    engineNo: String,
    cylinderNo: String,
    motorNo: String,
  },
  ids: {
    aadhar: String,
    pan: String,
  },
  checklist: [String], 
  createdAt: { type: Date, default: Date.now }
});
const Challan = mongoose.models.Challan || mongoose.model('Challan', ChallanSchema);

// 3. Agreement Schema
const AgreementSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  agreementId: String,
  model: {
    name: String,
    exShowroom: String,
    insurance: String,
    rto: String,
    permit: String,
    onRoadPrice: String,
    landingPrice: String
  },
  loan: {
    bankName: String,
    amount: String,
    processingFee: String
  },
  dto: {
    place: String,
    registration: String,
    onlinePayment: String,
    permit: String,
    total: String
  },
  broker: {
    name: String,
    phone: String,
    village: String,
    amount: String
  },
  payment: {
    downPayment: String,
    paidAmount: String,
    type: { type: String }, 
    date: Date,
    dues: String,
    netDues: String
  },
  other: {
    amount: String,
    remark: String
  },
  dse: {
    name: String,
    commission: String,
    netProfit: String,
    tds: String,
    finalNetProfit: String
  },
  createdAt: { type: Date, default: Date.now }
});
const Agreement = mongoose.models.Agreement || mongoose.model('Agreement', AgreementSchema);

// 4. NEW INVENTORY SCHEMAS (Two-Tier)

// Tier 1: Vehicle Model (Catalog Name)
const VehicleModelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true }, // e.g., "Rajhans Star"
  type: { type: String, default: 'E-Rickshaw' },
  createdAt: { type: Date, default: Date.now }
});
const VehicleModel = mongoose.models.VehicleModel || mongoose.model('VehicleModel', VehicleModelSchema);

// Tier 2: Vehicle Stock (Individual Physical Units)
const VehicleStockSchema = new mongoose.Schema({
  modelId: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleModel', required: true },
  
  // Configuration
  variant: { type: String, enum: ['Lead Acid', 'Lithium Ion'], required: true },
  voltage: { type: String, enum: ['48V', '60V'], required: true },
  color: { type: String, default: 'Red' },

  // Technical Identifiers
  chassisNo: { type: String, required: true, unique: true, trim: true },
  motorNo: { type: String, trim: true },
  batteryNo: { type: String, trim: true },

  // Financials
  exShowroom: { type: Number, default: 0 },
  insurance: { type: Number, default: 0 },
  rto: { type: Number, default: 0 },
  permit: { type: Number, default: 0 },
  purchaseRate: { type: Number, default: 0 },
  hsn: { type: String, default: '' },
  
  // Status
  status: { type: String, enum: ['Available', 'Sold', 'Booked'], default: 'Available' },
  createdAt: { type: Date, default: Date.now }
});
const VehicleStock = mongoose.models.VehicleStock || mongoose.model('VehicleStock', VehicleStockSchema);


// ==========================================
//  MIDDLEWARE
// ==========================================

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

// ==========================================
//  ROUTES
// ==========================================

// --- Auth Routes ---
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword, role: role || 'user' });
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CRM Routes (Customers) ---

app.get('/api/customers', verifyToken, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', verifyToken, async (req, res) => {
  try {
    const { personal, address } = req.body;
    const generatedId = `CUS-${Date.now().toString().slice(-4)}`;
    const newCustomer = await Customer.create({
      generatedId,
      personal,
      address,
      pipeline: { created: true, challan: false, agreement: false }
    });
    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Challan Routes ---

app.post('/api/challan', verifyToken, async (req, res) => {
  try {
    const { customerId, details, registration, engine, ids, checklist } = req.body;

    // Auto-generate Challan No
    const lastChallan = await Challan.findOne().sort({ createdAt: -1 });
    let nextChallanNo = 1001;

    if (lastChallan && lastChallan.details && lastChallan.details.challanNo) {
      const lastNo = parseInt(lastChallan.details.challanNo, 10);
      if (!isNaN(lastNo)) {
        nextChallanNo = lastNo + 1;
      }
    }

    const finalDetails = {
        ...details,
        challanNo: nextChallanNo.toString()
    };

    const newChallan = await Challan.create({
      customer: customerId,
      details: finalDetails,
      registration,
      engine,
      ids,
      checklist
    });
    
    await Customer.findByIdAndUpdate(customerId, { $set: { 'pipeline.challan': true } });
    res.status(201).json(newChallan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/challan/:customerId', verifyToken, async (req, res) => {
  try {
    const challan = await Challan.findOne({ customer: req.params.customerId });
    if (!challan) return res.status(404).json({ message: 'Challan not found' });
    res.json(challan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/challan/:id', verifyToken, async (req, res) => {
  try {
    const updatedChallan = await Challan.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body }, 
      { new: true }
    );
    res.json(updatedChallan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Agreement Routes ---

app.post('/api/agreement', verifyToken, async (req, res) => {
  try {
    // Auto-generate Agreement ID (starts from 1001)
    const lastAgreement = await Agreement.findOne().sort({ createdAt: -1 });
    let nextNo = 1001;

    if (lastAgreement && lastAgreement.agreementId) {
      const lastNo = parseInt(lastAgreement.agreementId, 10);
      if (!isNaN(lastNo)) {
        nextNo = lastNo + 1;
      }
    }

    const payload = { ...req.body };
    if (!payload.agreementId) {
        payload.agreementId = nextNo.toString();
    }

    const newAgreement = await Agreement.create(payload);
    await Customer.findByIdAndUpdate(payload.customerId, { $set: { 'pipeline.agreement': true } });
    res.status(201).json(newAgreement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/agreement/:customerId', verifyToken, async (req, res) => {
  try {
    const agreement = await Agreement.findOne({ customerId: req.params.customerId });
    if (!agreement) return res.status(404).json({ message: 'Agreement not found' });
    res.json(agreement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/agreement/:id', verifyToken, async (req, res) => {
  try {
    const updatedAgreement = await Agreement.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body }, 
      { new: true }
    );
    res.json(updatedAgreement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- NEW INVENTORY ROUTES ---

// 1. Get Models (Sidebar)
app.get('/api/models', verifyToken, async (req, res) => {
  try {
    const models = await VehicleModel.find().sort({ name: 1 });
    
    // Add "stockCount" to each model
    const modelsWithCount = await Promise.all(models.map(async (model) => {
      const count = await VehicleStock.countDocuments({ 
        modelId: model._id, 
        status: 'Available' 
      });
      return { ...model.toObject(), stockCount: count };
    }));

    res.json(modelsWithCount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Add New Model
app.post('/api/models', verifyToken, async (req, res) => {
  try {
    const { name, type } = req.body;
    const existing = await VehicleModel.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Model already exists' });

    const newModel = await VehicleModel.create({ 
        name, 
        type: type || 'E-Rickshaw'
    });
    res.status(201).json(newModel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2.1 Update Model
app.put('/api/models/:id', verifyToken, async (req, res) => {
    try {
        const { name, type } = req.body;
        const updated = await VehicleModel.findByIdAndUpdate(
            req.params.id,
            { name, type },
            { new: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2.2 Delete Model (Only if no stock units exist)
app.delete('/api/models/:id', verifyToken, async (req, res) => {
    try {
        // Security: Deleting a model requires checking if stock exists
        const stockCount = await VehicleStock.countDocuments({ modelId: req.params.id });
        if (stockCount > 0) {
            return res.status(400).json({ message: `Cannot delete model. ${stockCount} units are still in stock.` });
        }
        await VehicleModel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Model deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Get Stocks for a specific Model (Main Dashboard Table)
app.get('/api/stocks/:modelId', verifyToken, async (req, res) => {
  try {
    const stocks = await VehicleStock.find({ modelId: req.params.modelId }).sort({ createdAt: -1 });
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3.1 Get Stock by Chassis Number (For Agreement Auto-fill)
app.get('/api/stocks/chassis/:chassisNo', verifyToken, async (req, res) => {
    try {
        const stock = await VehicleStock.findOne({ chassisNo: req.params.chassisNo }).populate('modelId');
        if (!stock) {
            return res.status(404).json({ message: 'Stock not found with this Chassis Number' });
        }
        res.json(stock);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Add Specific Stock Unit
app.post('/api/stocks', verifyToken, async (req, res) => {
  try {
    const { 
      modelId, variant, voltage, 
      chassisNo, motorNo, batteryNo, color, 
      purchaseRate, hsn,
      exShowroom, insurance, rto, permit 
    } = req.body;

    const existingItem = await VehicleStock.findOne({ chassisNo });
    if (existingItem) {
      return res.status(400).json({ message: 'Vehicle with this Chassis Number already exists' });
    }

    const newStock = await VehicleStock.create({
      modelId, variant, voltage, chassisNo, motorNo, batteryNo, color,
      purchaseRate: Number(purchaseRate) || 0,
      hsn,
      exShowroom: Number(exShowroom) || 0,
      insurance: Number(insurance) || 0,
      rto: Number(rto) || 0,
      permit: Number(permit) || 0
    });

    res.status(201).json(newStock);
  } catch (error) {
    console.error("Stock Add Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Delete Stock Unit
app.delete('/api/stocks/:id', verifyToken, async (req, res) => {
  try {
    await VehicleStock.findByIdAndDelete(req.params.id);
    res.json({ message: 'Stock unit deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Update Stock (e.g., mark as sold)
app.put('/api/stocks/:id', verifyToken, async (req, res) => {
    try {
      const updatedStock = await VehicleStock.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );
      res.json(updatedStock);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


// 7. Aggregate Inventory (For Sales/Challan Dropdowns)
app.get('/api/inventory', verifyToken, async (req, res) => {
  try {
    const models = await VehicleModel.find().sort({ name: 1 });
    const inventory = await Promise.all(models.map(async (model) => {
      const stocks = await VehicleStock.find({ 
        modelId: model._id, 
        status: 'Available' 
      });
      // Extract unique colors from stock units
      const uniqueColors = [...new Set(stocks.map(s => s.color).filter(c => c))];
      
      const firstStock = stocks[0] || {};
      
      return {
        _id: model._id,
        modelName: model.name, // Maps to 'modelName' context in Sales.jsx
        colors: uniqueColors,
        pricing: {
            exShowroom: firstStock.exShowroom || 0,
            insurance: firstStock.insurance || 0,
            rto: firstStock.rto || 0,
            permit: firstStock.permit || 0
        }
      };
    }));
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Sales Analytics Aggregator
app.get('/api/analytics/sales', verifyToken, async (req, res) => {
  try {
    const agreements = await Agreement.find().sort({ createdAt: 1 });
    
    // KPI Aggregation
    const stats = agreements.reduce((acc, curr) => {
      acc.grossRevenue += parseFloat(curr.model.onRoadPrice) || 0;
      acc.netProfit += parseFloat(curr.dse.finalNetProfit) || 0;
      acc.tds += parseFloat(curr.dse.tds) || 0;
      acc.pendingDues += parseFloat(curr.payment.netDues) || 0;
      return acc;
    }, { grossRevenue: 0, netProfit: 0, tds: 0, pendingDues: 0 });

    // Monthly Trends (Last 12 months)
    const monthlyMap = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const formatter = new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0
    });

    agreements.forEach(agg => {
      const date = new Date(agg.createdAt);
      const monthLabel = months[date.getMonth()];
      if (!monthlyMap[monthLabel]) {
        monthlyMap[monthLabel] = { name: monthLabel, revenue: 0, expenses: 0, profit: 0 };
      }
      monthlyMap[monthLabel].revenue += (parseFloat(agg.model.onRoadPrice) || 0); 
      monthlyMap[monthLabel].profit += (parseFloat(agg.dse.finalNetProfit) || 0);
    });

    const financialMixedData = Object.values(monthlyMap);

    // Model Distribution
    const modelMap = {};
    agreements.forEach(agg => {
      const name = agg.model.name || 'Unknown';
      modelMap[name] = (modelMap[name] || 0) + 1;
    });

    const modelDistribution = Object.entries(modelMap).map(([name, value]) => ({
      name,
      value
    }));

    // Recent Sales Log
    const recentSales = agreements.slice(-5).reverse().map(agg => ({
        id: agg.agreementId || agg._id.toString().slice(-6),
        customer: 'Customer',
        model: agg.model.name,
        date: new Date(agg.createdAt).toLocaleDateString(),
        amount: `₹ ${formatter.format(parseFloat(agg.model.onRoadPrice) || 0)}`,
        status: parseFloat(agg.payment.netDues) <= 0 ? 'Paid' : 'Pending'
    }));

    // DSE Performance
    const dseMap = {};
    agreements.forEach(agg => {
        const name = agg.dse.name || 'Unassigned';
        if (!dseMap[name]) dseMap[name] = { name, leads: 0, closed: 0, revenue: 0 };
        dseMap[name].closed += 1;
        dseMap[name].revenue += parseFloat(agg.model.onRoadPrice) || 0;
    });
    const dsePerformance = Object.values(dseMap).map(d => ({
        ...d,
        revenue: `₹ ${formatter.format(d.revenue || 0)}`
    }));

    // Recent Activity Feed
    const recentActivity = agreements.slice(-4).reverse().map(agg => ({
        text: `New Agreement: ${agg.model.name}`,
        time: new Date(agg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'success'
    }));

    res.json({
      kpis: [
        { id: 'net_profit', label: 'Net Profit', value: `₹ ${formatter.format(stats.netProfit)}`, raw: stats.netProfit },
        { id: 'gross_rev', label: 'Gross Revenue', value: `₹ ${formatter.format(stats.grossRevenue)}`, raw: stats.grossRevenue },
        { id: 'dse_comm', label: 'DSE Payouts', value: '₹ 0', raw: 0 }, 
        { id: 'tds_deduct', label: 'TDS (5%)', value: `₹ ${formatter.format(stats.tds)}`, raw: stats.tds },
        { id: 'dues_pending', label: 'Pending Dues', value: `₹ ${formatter.format(stats.pendingDues)}`, raw: stats.pendingDues }
      ],
      financialMixedData,
      modelDistribution,
      recentSales,
      dsePerformance,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Serve React frontend (production/local fallback) ---
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Catch-all: serve index.html for all non-API routes (React Router support)
// Fixed for Express 5: using app.use instead of app.get('*') to avoid PathError
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'), err => {
    if (err) res.status(404).send('Frontend not built or missing.');
  });
});


// Start server only when run directly (not as a serverless function)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
}

// Global Error Handler for debugging Serverless environment
app.use((err, req, res, next) => {
  console.error("Express Error:", err);
  res.status(500).json({
    error: 'Global Error Handler',
    message: err.message || 'Unknown Error',
    stack: err.stack
  });
});

module.exports = app;