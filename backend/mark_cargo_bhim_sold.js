const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb+srv://shivanshDB:shivanshdb01@shivanshdb.tolmx9u.mongodb.net/?appName=shivanshDb';

mongoose.connect(uri)
  .then(async () => {
    const VehicleStockSchema = new mongoose.Schema({ chassisNo: String, status: String }, { strict: false });
    const VehicleStock = mongoose.models.VehicleStock || mongoose.model('VehicleStock', VehicleStockSchema);
    
    const result = await VehicleStock.updateMany(
        { chassisNo: 'MD9AEVHE1DH422491' },
        { $set: { status: 'Sold' } }
    );
    
    console.log(`Updated ${result.modifiedCount} records for MD9AEVHE1DH422491`);
    process.exit(0);
  })
  .catch(console.error);
