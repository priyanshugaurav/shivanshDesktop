const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/shivansh';

const LedgerSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  description: { type: String, required: true },
  category: { type: String, default: 'General' },
  type: { type: String, enum: ['Credit', 'Debit'], required: true },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true },
  partyName: { type: String, default: '' },
  paymentMethod: { type: String, default: 'Cash' },
  createdAt: { type: Date, default: Date.now }
});

const Ledger = mongoose.models.Ledger || mongoose.model('Ledger', LedgerSchema);

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const result = await Ledger.updateMany(
      { paymentMethod: 'Cash' },
      { $set: { paymentMethod: 'Bank Transfer' } }
    );
    console.log(`Updated ${result.modifiedCount} 'Cash' transactions to 'Bank Transfer'.`);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
