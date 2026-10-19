const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb+srv://shivanshDB:shivanshdb01@shivanshdb.tolmx9u.mongodb.net/?appName=shivanshDb';

mongoose.connect(uri)
  .then(async () => {
    // Schemas
    const PartySchema = new mongoose.Schema({
      name: String, phone: String, type: String, openingBalance: Number, balanceType: String, createdAt: Date
    }, { strict: false });
    const Party = mongoose.models.Party || mongoose.model('Party', PartySchema);

    const LedgerSchema = new mongoose.Schema({
      date: Date, description: String, category: String, type: String, transactionPurpose: String,
      amount: Number, balance: Number, partyId: mongoose.Schema.Types.ObjectId, partyName: String,
      paymentMethod: String, createdAt: Date
    }, { strict: false });
    const Ledger = mongoose.models.Ledger || mongoose.model('Ledger', LedgerSchema);

    // Create Sample Parties
    const customer = await Party.create({
      name: 'John Doe (Demo Customer)',
      phone: '9876543210',
      type: 'Customer',
      openingBalance: 0,
      balanceType: 'Receivable',
      createdAt: new Date()
    });

    const supplier = await Party.create({
      name: 'ABC Motors (Demo Supplier)',
      phone: '9988776655',
      type: 'Supplier',
      openingBalance: 0,
      balanceType: 'Payable',
      createdAt: new Date()
    });

    // Create Sample Transactions
    // 1. Credit Sale to Customer
    await Ledger.create({
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      description: 'Sold E-Rickshaw on Credit (Invoice #101)',
      category: 'Vehicle Sale',
      type: 'Credit',
      transactionPurpose: 'Credit Invoice',
      amount: 150000,
      balance: 150000, // global balance dummy
      partyId: customer._id,
      partyName: customer.name,
      paymentMethod: 'Credit',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    });

    // 2. Customer pays partially
    await Ledger.create({
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      description: 'Part payment received via Bank Transfer',
      category: 'Vehicle Sale',
      type: 'Credit',
      transactionPurpose: 'Payment Received',
      amount: 50000,
      balance: 200000,
      partyId: customer._id,
      partyName: customer.name,
      paymentMethod: 'Bank Transfer',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });

    // 3. Purchase on Credit from Supplier
    await Ledger.create({
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      description: 'Bought 10 Batteries on Credit (Bill #B55)',
      category: 'Inventory Purchase',
      type: 'Debit',
      transactionPurpose: 'Credit Bill',
      amount: 80000,
      balance: 120000,
      partyId: supplier._id,
      partyName: supplier.name,
      paymentMethod: 'Credit',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });

    // 4. We pay the Supplier partially
    await Ledger.create({
      date: new Date(), // today
      description: 'Paid advance for battery invoice #B55',
      category: 'Supplier Pay',
      type: 'Debit',
      transactionPurpose: 'Payment Made',
      amount: 20000,
      balance: 100000,
      partyId: supplier._id,
      partyName: supplier.name,
      paymentMethod: 'UPI',
      createdAt: new Date()
    });

    console.log('Sample data seeded successfully.');
    process.exit(0);
  })
  .catch(console.error);
