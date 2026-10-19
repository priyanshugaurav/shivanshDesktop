const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb+srv://shivanshDB:shivanshdb01@shivanshdb.tolmx9u.mongodb.net/?appName=shivanshDb';

mongoose.connect(uri).then(async () => {
  const PartySchema = new mongoose.Schema({ name: String, phone: String, type: String, openingBalance: Number, balanceType: String, createdAt: Date }, { strict: false });
  const Party = mongoose.models.Party || mongoose.model('Party', PartySchema);

  const LedgerSchema = new mongoose.Schema({ date: Date, description: String, category: String, type: String, transactionPurpose: String, amount: Number, balance: Number, partyId: mongoose.Schema.Types.ObjectId, partyName: String, paymentMethod: String, createdAt: Date }, { strict: false });
  const Ledger = mongoose.models.Ledger || mongoose.model('Ledger', LedgerSchema);

  await Ledger.deleteMany({});
  await Party.deleteMany({});
  console.log('Cleared all data.');

  const rajiv = await Party.create({
    name: 'RAJIV TRADERS', phone: '', type: 'Supplier', openingBalance: 0, balanceType: 'Payable', createdAt: new Date()
  });
  console.log('Created RAJIV TRADERS:', rajiv._id);

  // Format: [date, description, type, purpose, amount, method]
  // Debit = vehicle/goods received (liability created, Dr in physical book)
  // Credit = NEFT/cash going OUT of business (Cr in physical book)
  const entries = [
    ['2026-03-03', 'Invoice #50 - RAJHANSH SUPERFLEXI purchased',   'Debit',  'Credit Bill',   131604, 'Credit'],
    ['2026-03-03', 'Invoice #43 - PROMAX purchased',                'Debit',  'Credit Bill',   135663, 'Credit'],
    ['2026-03-03', 'NEFT TR. (IDFC) - Payment to Rajiv Traders',   'Credit', 'Payment Made',  135663, 'Bank Transfer'],
    ['2026-03-03', 'NEFT TR. (IDFC) - Payment to Rajiv Traders',   'Credit', 'Payment Made',  131604, 'Bank Transfer'],
    ['2026-03-04', 'EV EXL purchased',                             'Debit',  'Credit Bill',   138183, 'Credit'],
    ['2026-03-04', 'NEFT TR. (IDFC) - Partial payment',            'Credit', 'Payment Made',   50000, 'Bank Transfer'],
    ['2026-04-04', 'NEFT TR. (IDFC) - Partial payment',            'Credit', 'Payment Made',   40000, 'Bank Transfer'],
    ['2026-04-04', 'Invoice #51 - SUPERFLEXI purchased',           'Debit',  'Credit Bill',   131604, 'Credit'],
    ['2026-03-05', 'NEFT TR. (IDFC) - Full balance payment',       'Credit', 'Payment Made',  179787, 'Bank Transfer'],
    ['2026-03-05', 'Invoice #54 - PROMAX purchased',               'Debit',  'Credit Bill',   135663, 'Credit'],
    ['2026-03-05', 'NEFT TR. (IDFC) - Partial payment',            'Credit', 'Payment Made',  100000, 'Bank Transfer'],
    ['2026-03-05', 'Invoice #55 - SUPERFLEXI purchased',           'Debit',  'Credit Bill',   131604, 'Credit'],
    ['2026-03-05', 'NEFT TR. (IDFC) - Full balance payment',       'Credit', 'Payment Made',  167266, 'Bank Transfer'],
    ['2026-05-03', 'NEFT TR. (IDFC) - Advance payment',            'Credit', 'Payment Made',  144999, 'Bank Transfer'],
    ['2026-05-03', 'Invoice #56 - EV BHIM purchased',              'Debit',  'Credit Bill',   144999, 'Credit'],
    ['2026-05-03', 'Invoice #58 - PROMAX purchased',               'Debit',  'Credit Bill',   135663, 'Credit'],
    ['2026-05-03', 'NEFT TR. (IDFC) - Partial payment',            'Credit', 'Payment Made',   50000, 'Bank Transfer'],
    ['2026-05-03', 'NEFT TR. (IDFC) - Partial payment',            'Credit', 'Payment Made',  100000, 'Bank Transfer'],
    ['2026-05-03', 'NEFT TR. (IDFC) - Payment',                    'Credit', 'Payment Made',  200000, 'Bank Transfer'],
    ['2026-11-08', 'Invoice #61 LS - SAMARI MS purchased',         'Debit',  'Credit Bill',   163917, 'Credit'],
    ['2026-11-01', 'Invoice #64 LS - SAMARI SS purchased',         'Debit',  'Credit Bill',   161418, 'Credit'],
    ['2026-05-01', 'NEFT TR. (IDFC) - Payment to Rajiv Traders',  'Credit', 'Payment Made',   55997, 'Bank Transfer'],
  ];

  let runningBalance = 0;
  for (const [date, description, type, purpose, amount, method] of entries) {
    // Balance tracks our NET obligation to Rajiv Traders:
    // Debit+Credit Bill = obligation goes UP
    // Credit+Payment Made = obligation goes DOWN
    if (purpose === 'Credit Bill') runningBalance += amount;
    else if (purpose === 'Payment Made') runningBalance -= amount;

    await Ledger.create({
      date: new Date(date), description, category: purpose === 'Credit Bill' ? 'Vehicle Purchase' : 'Supplier Pay',
      type, transactionPurpose: purpose, amount, balance: runningBalance,
      partyId: rajiv._id, partyName: 'RAJIV TRADERS', paymentMethod: method,
      createdAt: new Date(date)
    });
  }

  console.log(`Seeded ${entries.length} transactions. Final balance owed to Rajiv Traders: ${runningBalance}`);
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
