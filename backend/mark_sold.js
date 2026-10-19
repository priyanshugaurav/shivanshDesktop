const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb+srv://shivanshDB:shivanshdb01@shivanshdb.tolmx9u.mongodb.net/?appName=shivanshDb';

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // We need to require the VehicleStock schema
    // Let's just redefine it minimally to do the update
    const VehicleStockSchema = new mongoose.Schema({
        chassisNo: String,
        status: String
    }, { strict: false });
    
    const VehicleStock = mongoose.models.VehicleStock || mongoose.model('VehicleStock', VehicleStockSchema);
    
    // Update the specific chassis
    // Note: It might be stored as MD2B47BX5TM-84260 or MD2B47BX5TM84260
    const result1 = await VehicleStock.updateMany(
        { chassisNo: { $regex: /MD2B47BX5TM/i } },
        { $set: { status: 'Sold' } }
    );
    
    console.log(`Updated ${result1.modifiedCount} records for MD2B47BX5TM`);

    // Let's also run a bulk sync just in case
    const ChallanSchema = new mongoose.Schema({
        engine: { frameNo: String }
    }, { strict: false });
    const Challan = mongoose.models.Challan || mongoose.model('Challan', ChallanSchema);

    const allChallans = await Challan.find({ 'engine.frameNo': { $exists: true, $ne: '' } });
    let matched = 0, notFound = 0;

    for (const challan of allChallans) {
      const frame = (challan.engine?.frameNo || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (!frame) continue;

      const result = await VehicleStock.findOneAndUpdate(
        { chassisNo: frame },
        { $set: { status: 'Sold' } }
      );
      if (result) { matched++; } else { notFound++; }
    }
    
    console.log(`[SYNC] Processed ${allChallans.length} challans. Matched: ${matched}, Not in stock: ${notFound}`);

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
