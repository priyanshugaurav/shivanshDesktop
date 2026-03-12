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
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors({
  origin: allowedOrigin || true,
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

// 3. NEW INVENTORY SCHEMAS (Two-Tier)

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
    res.status(500).json({ error: error.message });
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
    const { name } = req.body;
    const existing = await VehicleModel.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Model already exists' });

    const newModel = await VehicleModel.create({ name });
    res.status(201).json(newModel);
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

// 4. Add Specific Stock Unit
app.post('/api/stocks', verifyToken, async (req, res) => {
  try {
    const { 
      modelId, variant, voltage, 
      chassisNo, motorNo, batteryNo, color, 
      purchaseRate, hsn 
    } = req.body;

    const existingItem = await VehicleStock.findOne({ chassisNo });
    if (existingItem) {
      return res.status(400).json({ message: 'Vehicle with this Chassis Number already exists' });
    }

    const newStock = await VehicleStock.create({
      modelId,
      variant,
      voltage,
      chassisNo,
      motorNo,
      batteryNo,
      color,
      purchaseRate: Number(purchaseRate),
      hsn
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