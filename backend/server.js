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
const frontendPath = path.join(__dirname, '../frontend/dist');


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
    variant: String,
    voltage: String,
  },
  registration: {
    productNo: String,
    bookNo: String,
    keyNo: String,
    batteryNo: String,
    batteryCompany: String,
    chargerNo: String,
    chargerCompany: String,
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
    dseCommission: String,
    netProfit: String,
    tds: String,
    finalNetProfit: String
  },
  registrationNo: String,
  permitNo: String,
  permitDate: Date,
  createdAt: { type: Date, default: Date.now }
});
const Agreement = mongoose.models.Agreement || mongoose.model('Agreement', AgreementSchema);

// 5. COLLECTION SCHEMA (For Installments)
const CollectionSchema = new mongoose.Schema({
  agreementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agreement', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['Cash', 'UPI', 'Cheque'], default: 'Cash' },
  date: { type: Date, default: Date.now }
});
const Collection = mongoose.models.Collection || mongoose.model('Collection', CollectionSchema);

// 6. EMPLOYEE SCHEMA (For Staff & Payroll)
const EmployeeSchema = new mongoose.Schema({
  personal: {
    firstName: String,
    lastName: String,
    phone: String,
    email: String,
    dob: String,
    bloodGroup: String,
    address: String
  },
  professional: {
    employeeId: { type: String, unique: true },
    role: { type: String, default: 'DSE' },
    status: { type: String, enum: ['Active', 'On Leave', 'Probation', 'Left'], default: 'Probation' },
    location: { type: String, default: 'Showroom' },
    joinDate: { type: Date, default: Date.now },
  },
  financial: {
    baseSalary: { type: Number, default: 0 },
    allowance: { type: Number, default: 0 },
    incentives: { type: Number, default: 0 },
    tax: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});
const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
 
// 6.5 SALARY RECORD SCHEMA (Monthly Payments)
const SalaryRecordSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month: { type: String, required: true }, // e.g: "March"
  year: { type: Number, required: true },  // e.g: 2026
  baseSalary: Number,
  allowance: Number,
  incentives: Number,
  tax: Number,
  otherAmount: { type: Number, default: 0 },
  remark: { type: String, default: '' },
  totalPayable: Number,
  paymentDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Paid', 'Pending', 'Adjusted'], default: 'Paid' },
  createdAt: { type: Date, default: Date.now }
});
const SalaryRecord = mongoose.models.SalaryRecord || mongoose.model('SalaryRecord', SalaryRecordSchema);
 
// 6.7 EXPENSE SCHEMA
const ExpenseSchema = new mongoose.Schema({
  id: String, // Auto-generated ID (e.g., EXP-001)
  category: { type: String, required: true },
  description: String,
  amount: { type: Number, required: true },
  date: { type: Number, required: true }, // Day of month (1-31)
  month: { type: String, required: true },
  year: { type: Number, required: true },
  status: { type: String, default: 'Paid' },
  type: { type: String, enum: ['Manual', 'Payroll'], default: 'Manual' },
  createdAt: { type: Date, default: Date.now }
});
const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);

// 7. NEW INVENTORY SCHEMAS (Two-Tier)

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
  batteryCompany: { type: String, trim: true, default: '' },
  chargerNo: { type: String, trim: true, default: '' },
  chargerCompany: { type: String, trim: true, default: '' },

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

// 8. ENQUIRY SCHEMA (CRM)
const EnquirySchema = new mongoose.Schema({
  Name: String,
  Phone: String,
  Village: String,
  Model: String,
  status: { type: String, default: 'New' },
  createdAt: { type: Date, default: Date.now }
});
const Enquiry = mongoose.models.Enquiry || mongoose.model('Enquiry', EnquirySchema);

// --- Dashboard Stats Route ---
app.get('/api/dashboard/stats', verifyToken, async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long' });
    const currentYear = now.getFullYear();

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.toLocaleString('default', { month: 'long' });
    const lastMonthYear = lastMonthDate.getFullYear();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 1. Profit (Calculate using Agreements but filtered by the Challan Date)
    const currentMonthChallans = await Challan.find({
      'details.challanDate': { $gte: startOfMonth, $lte: endOfMonth }
    });
    const currentMonthCustomerIds = currentMonthChallans.map(c => c.customer);
    const agreements = await Agreement.find({ customerId: { $in: currentMonthCustomerIds } });
    
    const currentMonthProfit = agreements.reduce((acc, curr) => acc + (Number(curr.dse?.finalNetProfit) || 0), 0);
    const currentMonthRevenue = agreements.reduce((acc, curr) => acc + (Number(curr.payment?.paidAmount) || 0), 0);

    const startOfLastMonth = new Date(lastMonthYear, lastMonthDate.getMonth(), 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const lastMonthChallans = await Challan.find({
      'details.challanDate': { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });
    const lastMonthCustomerIds = lastMonthChallans.map(c => c.customer);
    const lastMonthAgreements = await Agreement.find({ customerId: { $in: lastMonthCustomerIds } });

    const lastMonthProfit = lastMonthAgreements.reduce((acc, curr) => acc + (Number(curr.dse?.finalNetProfit) || 0), 0);
    const profitGrowth = lastMonthProfit === 0 ? 100 : ((currentMonthProfit - lastMonthProfit) / lastMonthProfit) * 100;

    // 2. Enquiries (Filtered by this month)
    const totalEnquiries = await Enquiry.countDocuments({ status: { $ne: 'Closed' }, createdAt: { $gte: startOfMonth, $lte: endOfMonth } });
    const hotEnquiries = await Enquiry.countDocuments({ status: 'Hot', createdAt: { $gte: startOfMonth, $lte: endOfMonth } });
    const newEnquiries = await Enquiry.countDocuments({ status: 'New', createdAt: { $gte: startOfMonth, $lte: endOfMonth } });

    // 3. Inventory
    const totalInventory = await VehicleStock.countDocuments({ status: 'Available' });
    const lowStockAlert = await VehicleStock.findOne({ status: 'Available' }).populate('modelId');
    
    // 4. Pending Dues
    const allAgreements = await Agreement.find();
    const totalDues = allAgreements.reduce((acc, curr) => acc + (Number(curr.payment?.netDues) || 0), 0);
    const overdueCount = allAgreements.filter(a => Number(a.payment?.netDues) > 0).length;

    // 5. Staff Presence
    const activeStaff = await Employee.countDocuments({ 'professional.status': 'Active' });
    const totalStaff = await Employee.countDocuments();

    // 6. Expenses
    const currentMonthExpenses = await Expense.find({ month: currentMonth, year: currentYear });
    const totalExpenses = currentMonthExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const payrollExpenses = currentMonthExpenses.filter(e => e.type === 'Payroll').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const payrollPercentage = totalExpenses === 0 ? 0 : Math.round((payrollExpenses / totalExpenses) * 100);

    res.json({
      revenue: {
        amount: currentMonthProfit, // User wants this to be Net Profit
        growth: profitGrowth.toFixed(1)
      },
      collections: { // Kept separate just in case
        amount: currentMonthRevenue 
      },
      enquiries: {
        total: totalEnquiries,
        hot: hotEnquiries,
        new: newEnquiries
      },
      inventory: {
        total: totalInventory,
        alert: lowStockAlert ? `${lowStockAlert.modelId.name} (${lowStockAlert.color})` : 'Stable'
      },
      dues: {
        amount: totalDues,
        customers: overdueCount
      },
      staff: {
        active: activeStaff,
        total: totalStaff
      },
      expenses: {
        amount: totalExpenses,
        payrollPercentage
      }
    });

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
    
    // Deduct stock
    if (engine && engine.frameNo) {
        const normalizedFrameNo = engine.frameNo.trim().toUpperCase();
        await VehicleStock.findOneAndUpdate(
            { chassisNo: normalizedFrameNo }, 
            { status: 'Sold' }
        );
    }

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
    const oldChallan = await Challan.findById(req.params.id);
    const updatedChallan = await Challan.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body }, 
      { new: true }
    );

    // Stock Rollback/Sync Logic
    if (oldChallan && req.body.engine && req.body.engine.frameNo) {
        const oldFrame = (oldChallan.engine?.frameNo || '').trim().toUpperCase();
        const newFrame = req.body.engine.frameNo.trim().toUpperCase();

        if (oldFrame !== newFrame) {
            // 1. Release old chassis back to Available
            if (oldFrame) {
                await VehicleStock.findOneAndUpdate({ chassisNo: oldFrame }, { status: 'Available' });
            }
            // 2. Mark new chassis as Sold
            if (newFrame) {
                await VehicleStock.findOneAndUpdate({ chassisNo: newFrame }, { status: 'Sold' });
            }
        }
    }

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

    // Sync Stock status from Agreement chassis just in case Challan was skipped
    // We already enriched registration-queue with challan frameNo, 
    // but some users might manually enter chassis in Agreement if no Challan exists.
    // Assuming model or broker selection doesn't carry chassis, but some UI might.
    // If 'engine' data is present in Agreement payload as well:
    if (payload.engine && payload.engine.frameNo) {
        const frame = payload.engine.frameNo.trim().toUpperCase();
        await VehicleStock.findOneAndUpdate({ chassisNo: frame }, { status: 'Sold' });
    }

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

// Get all agreements for a specific staff (DSE) by name
app.get('/api/agreements/staff/:name', verifyToken, async (req, res) => {
  try {
    const agreements = await Agreement.find({ 'dse.name': req.params.name })
                                     .populate('customerId')
                                     .sort({ createdAt: -1 });
    res.json(agreements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: All agreements for Registration Queue with enriched data
app.get('/api/agreements/registration-queue', verifyToken, async (req, res) => {
  try {
    const agreements = await Agreement.find()
                                     .populate('customerId')
                                     .sort({ createdAt: -1 });
    
    const enriched = await Promise.all(agreements.map(async (agg) => {
      // Try to find matching chassis no from Challan
      const challan = await Challan.findOne({ customer: agg.customerId?._id });
      return {
        ...agg.toObject(),
        chassis: challan?.engine?.frameNo || 'N/A'
      };
    }));
    
    res.json(enriched);
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
        if (!stock) return res.status(404).json({ message: 'Stock not found' });
        res.json(stock);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3.2 Get ALL available stocks (For Challan Auto-fill)
app.get('/api/available-stocks', verifyToken, async (req, res) => {
    try {
        const stocks = await VehicleStock.find({ status: 'Available' }).populate('modelId');
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
    const { range, month, year } = req.query;
    let challanQuery = {};
    const now = new Date();
    
    if (range) {
        if (range === 'This Month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            challanQuery['details.challanDate'] = { $gte: start, $lte: end };
        } else if (range === 'Last Month') {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            challanQuery['details.challanDate'] = { $gte: start, $lte: end };
        } else if (range === 'Custom Month' && month && year) {
            const monthIdx = new Date(`${month} 1, 2000`).getMonth();
            const start = new Date(year, monthIdx, 1);
            const end = new Date(year, monthIdx + 1, 0, 23, 59, 59);
            challanQuery['details.challanDate'] = { $gte: start, $lte: end };
        } else if (range === 'All Time') {
            challanQuery = {}; 
        }
    } else {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        challanQuery['details.challanDate'] = { $gte: start, $lte: end };
    }

    const challans = await Challan.find(challanQuery);
    const customerIds = challans.map(c => c.customer);

    // Map each customer to their challan date for accurate historical rendering
    const challanDateMap = {};
    challans.forEach(c => {
       if (c.customer && c.details?.challanDate) {
          challanDateMap[c.customer.toString()] = new Date(c.details.challanDate);
       }
    });

    // If 'All Time', fetch all agreements. Otherwise filter strictly by Challans
    const agreementQuery = (range === 'All Time' || (Object.keys(challanQuery).length === 0 && !challanQuery['details.challanDate'])) 
        ? {} 
        : { customerId: { $in: customerIds } };
        
    const agreements = await Agreement.find(agreementQuery).sort({ createdAt: 1 });
    
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
      const date = challanDateMap[agg.customerId?.toString()] || new Date(agg.createdAt);
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
        date: (challanDateMap[agg.customerId?.toString()] || new Date(agg.createdAt)).toLocaleDateString(),
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

    // --- 0. Enhanced Floor Activity (Leads, Bookings, Sales combined) ---
    const [recentLeads, recentBookings, recentAgreements] = await Promise.all([
      Customer.find().sort({ createdAt: -1 }).limit(5),
      Challan.find().sort({ createdAt: -1 }).limit(5).populate('customer'),
      Agreement.find().sort({ createdAt: -1 }).limit(5).populate('customerId')
    ]);

    const activityFeed = [
      ...recentLeads.map(l => ({
        text: `Customer Created: ${l.personal.firstName} ${l.personal.lastName}`,
        time: l.createdAt,
        type: 'info'
      })),
      ...recentBookings.map(b => ({
        text: `Challan Updated: ${b.customer?.personal.firstName || 'Customer'} ${b.customer?.personal.lastName || ''}`,
        time: b.createdAt,
        type: 'warning'
      })),
      ...recentAgreements.map(a => ({
        text: `Agreement Created: ${a.customerId?.personal.firstName || 'Customer'} ${a.customerId?.personal.lastName || ''}`,
        time: a.createdAt,
        type: 'success'
      }))
    ].sort((a, b) => b.time - a.time).slice(0, 10).map(act => ({
      ...act,
      time: new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    const recentActivity = activityFeed;

    // --- 1. Conversion Funnel (Leads -> Bookings -> Deliveries) ---
    const [leadsCount, bookingsCount, deliveriesCount] = await Promise.all([
      Customer.countDocuments(),
      Challan.countDocuments(),
      Agreement.countDocuments()
    ]);

    const funnelData = [
      { name: 'Total Customer', value: leadsCount, fill: '#cbd5e1' },
      { name: 'Challan', value: bookingsCount, fill: '#94a3b8' },
      { name: 'Agreement', value: deliveriesCount, fill: 'THEME_COLOR' }
    ];

    // --- 2. Broker Leaderboard (New: Matches Heatmap replacement) ---
    const brokerStats = await Agreement.aggregate([
      { $group: { _id: "$broker.name", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 7 }
    ]);
    const brokerData = brokerStats.map(b => ({
      name: b._id || 'Direct',
      count: b.count
    }));

    // --- 3. Available Stock Inventory Breakdown ---
    const availableStockResults = await VehicleStock.aggregate([
      { $match: { status: 'Available' } },
      {
        $lookup: {
          from: 'vehiclemodels', // Check the collection name in your DB
          localField: 'modelId',
          foreignField: '_id',
          as: 'model'
        }
      },
      { $unwind: '$model' },
      { $group: { _id: '$model.name', count: { $sum: 1 } } }
    ]);

    const availablePerModel = availableStockResults.map(r => ({
      name: r._id,
      count: r.count
    }));

    const totalAvailable = availablePerModel.reduce((acc, curr) => acc + curr.count, 0);

    // --- 4. Payment Dues (Radar: Paid vs Dues) ---
    const paymentStats = agreements.reduce((acc, curr) => {
        acc.paid += (parseFloat(curr.payment.paidAmount) || 0);
        acc.dues += (parseFloat(curr.payment.netDues) || 0);
        return acc;
    }, { paid: 0, dues: 0 });

    const totalContractValue = paymentStats.paid + paymentStats.dues;
    const duesRadar = [
        { subject: 'Paid', A: totalContractValue > 0 ? (paymentStats.paid / totalContractValue) * 100 : 0, fullMark: 100 },
        { subject: 'Dues', A: totalContractValue > 0 ? (paymentStats.dues / totalContractValue) * 100 : 0, fullMark: 100 },
        { subject: 'Finance', A: 85, fullMark: 100 }, // Estimate
        { subject: 'Margin', A: 75, fullMark: 100 }, // Estimate
    ];

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
      recentActivity,
      funnelData,
      brokerData,
      duesRadar,
      availablePerModel,
      totalAvailable
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Dues & Collections Routes ---

app.get('/api/dues', verifyToken, async (req, res) => {
  try {
    // Find agreements where netDues > 0
    const pendingDues = await Agreement.find({
      $expr: { $gt: [{ $toDouble: "$payment.netDues" }, 0] }
    }).populate('customerId').sort({ createdAt: -1 });

    const formattedDues = pendingDues.map(d => ({
      id: d.agreementId || d._id,
      mongodbId: d._id,
      customer: `${d.customerId?.personal.firstName} ${d.customerId?.personal.lastName}`,
      phone: d.customerId?.personal.phone,
      model: d.model.name,
      totalAmount: parseFloat(d.model.onRoadPrice) || 0,
      paidAmount: parseFloat(d.payment.paidAmount) || 0,
      balance: parseFloat(d.payment.netDues) || 0
    }));

    res.json(formattedDues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/dues/collect', verifyToken, async (req, res) => {
  try {
    const { agreementId, amount, method } = req.body;
    const agreement = await Agreement.findById(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found' });

    // 1. Create Collection Entry
    await Collection.create({
      agreementId: agreement._id,
      customerId: agreement.customerId,
      amount: Number(amount),
      method: method || 'Cash'
    });

    // 2. Update Agreement Balance
    const newPaid = (parseFloat(agreement.payment.paidAmount) || 0) + Number(amount);
    const newDues = (parseFloat(agreement.payment.netDues) || 0) - Number(amount);

    await Agreement.findByIdAndUpdate(agreementId, {
      $set: {
        'payment.paidAmount': newPaid.toString(),
        'payment.netDues': newDues.toString()
      }
    });

    res.json({ message: 'Payment recorded successfully', newDues });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dues/history', verifyToken, async (req, res) => {
  try {
    const history = await Collection.find()
      .sort({ date: -1 })
      .limit(20)
      .populate('customerId');

    const formattedHistory = history.map(h => ({
      id: h._id,
      customer: `${h.customerId?.personal.firstName} ${h.customerId?.personal.lastName}`,
      date: new Date(h.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: h.amount,
      method: h.method
    }));

    res.json(formattedHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Employee Routes ---

app.get('/api/employees', verifyToken, async (req, res) => {
  try {
    const employees = await Employee.find().sort({ 'professional.joinDate': -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/employees', verifyToken, async (req, res) => {
  try {
    const { personal, professional, financial } = req.body;
    
    // Auto-generate Employee ID
    const count = await Employee.countDocuments();
    const year = new Date().getFullYear();
    const employeeId = `EMP-${year}-${(count + 1).toString().padStart(3, '0')}`;

    const newEmployee = await Employee.create({
      personal,
      professional: { ...professional, employeeId },
      financial
    });

    res.status(201).json(newEmployee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/employees/:id', verifyToken, async (req, res) => {
  try {
    const { personal, professional, financial } = req.body;
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { personal, professional, financial },
      { new: true }
    );
    if (!updatedEmployee) return res.status(404).json({ message: 'Employee not found' });
    res.json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/employees/:id', verifyToken, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    
    // Also cleanup any salary records
    await SalaryRecord.deleteMany({ employeeId: req.params.id });
    
    res.json({ message: 'Employee and their payroll history deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process Payroll (Monthly Salary Record)
app.post('/api/employees/:id/payroll', verifyToken, async (req, res) => {
  try {
    const { month, year, baseSalary, allowance, incentives, tax, otherAmount, remark, totalPayable } = req.body;
    
    // Check if duplicate for the same month/year
    const existing = await SalaryRecord.findOne({ employeeId: req.params.id, month, year });
    if (existing) return res.status(400).json({ message: 'Payroll for this month/year already processed.' });

    const record = await SalaryRecord.create({
      employeeId: req.params.id,
      month,
      year,
      baseSalary,
      allowance,
      incentives,
      tax,
      otherAmount,
      remark,
      totalPayable,
      status: 'Paid'
    });
    
    // Auto-generate Expense Entry for Payroll
    const emp = await Employee.findById(req.params.id);
    const empName = emp ? `${emp.personal.firstName} ${emp.personal.lastName}` : 'Staff';
    
    const count = await Expense.countDocuments();
    const expenseId = `EXP-${(count + 1).toString().padStart(3, '0')}`;
    
    await Expense.create({
        id: expenseId,
        category: 'Salary',
        description: `Staff Payroll: ${empName} (${month} ${year})`,
        amount: totalPayable,
        date: new Date().getDate(),
        month,
        year,
        status: 'Processed',
        type: 'Payroll'
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Salary Record (Void Payroll)
app.delete('/api/employees/:id/payroll/:recordId', verifyToken, async (req, res) => {
  try {
    const record = await SalaryRecord.findById(req.params.recordId);
    if (!record) return res.status(404).json({ message: 'Salary record not found' });

    // 1. Find and Delete associated Expense
    const emp = await Employee.findById(req.params.id);
    if (emp) {
        const empName = `${emp.personal.firstName} ${emp.personal.lastName}`;
        const description = `Staff Payroll: ${empName} (${record.month} ${record.year})`;
        await Expense.findOneAndDelete({ 
            category: 'Salary', 
            type: 'Payroll', 
            description,
            month: record.month,
            year: record.year
        });
    }

    // 2. Delete the Salary Record
    await SalaryRecord.findByIdAndDelete(req.params.recordId);

    res.json({ message: 'Payroll record voided and expense removed.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/employees/:id/payroll', verifyToken, async (req, res) => {
  try {
    const history = await SalaryRecord.find({ employeeId: req.params.id }).sort({ year: -1, createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Serve React frontend (production/local fallback) ---
app.use(express.static(frontendPath));

// 9. EXPENSE ROUTES
app.get('/api/expenses', verifyToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {};
    if (month) filter.month = month;
    if (year) filter.year = Number(year);
    
    // Self-Healing: Backfill missing payroll expenses for the filtered period
    if (month && year) {
        const salaries = await SalaryRecord.find({ month, year: Number(year) });
        for (const sal of salaries) {
            // Check if expense exists for this specific salary record
            const emp = await Employee.findById(sal.employeeId);
            const empName = emp ? `${emp.personal.firstName} ${emp.personal.lastName}` : 'Staff';
            const description = `Staff Payroll: ${empName} (${month} ${year})`;
            
            const existingExpense = await Expense.findOne({ 
                category: 'Salary', 
                type: 'Payroll', 
                description,
                month,
                year: Number(year)
            });
            
            if (!existingExpense) {
                const count = await Expense.countDocuments();
                await Expense.create({
                    id: `EXP-${(count + 1).toString().padStart(3, '0')}`,
                    category: 'Salary',
                    description,
                    amount: sal.totalPayable,
                    date: 1, // Use 1st of month for historical backfills 
                    month,
                    year: Number(year),
                    status: 'Processed',
                    type: 'Payroll'
                });
            }
        }
    }

    const expenses = await Expense.find(filter).sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/expenses', verifyToken, async (req, res) => {
  try {
    const { category, description, amount, date, month, year } = req.body;
    
    const count = await Expense.countDocuments();
    const expenseId = `EXP-${(count + 1).toString().padStart(3, '0')}`;

    const newExpense = await Expense.create({
      id: expenseId,
      category,
      description,
      amount: Number(amount),
      date: Number(date) || new Date().getDate(),
      month,
      year,
      status: 'Paid',
      type: 'Manual'
    });
    
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/expenses/:id', verifyToken, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    
    if (expense.type === 'Payroll') {
        return res.status(403).json({ message: 'Automated payroll expenses cannot be deleted manually.' });
    }
    
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
  app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
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