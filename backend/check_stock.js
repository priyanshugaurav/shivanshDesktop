const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb+srv://shivanshDB:shivanshdb01@shivanshdb.tolmx9u.mongodb.net/?appName=shivanshDb';

mongoose.connect(uri)
  .then(async () => {
    const VehicleModelSchema = new mongoose.Schema({ name: String }, { strict: false });
    const VehicleModel = mongoose.models.VehicleModel || mongoose.model('VehicleModel', VehicleModelSchema);
    
    const VehicleStockSchema = new mongoose.Schema({ chassisNo: String, status: String, modelId: mongoose.Schema.Types.ObjectId }, { strict: false });
    const VehicleStock = mongoose.models.VehicleStock || mongoose.model('VehicleStock', VehicleStockSchema);
    
    const bhimModel = await VehicleModel.findOne({ name: 'CARGO BHIM' });
    if (bhimModel) {
      const bhimStocks = await VehicleStock.find({ modelId: bhimModel._id });
      console.log('CARGO BHIM STOCKS:');
      bhimStocks.forEach(s => console.log(`- ${s.chassisNo} (${s.status})`));
    } else {
      console.log('CARGO BHIM model not found');
    }

    const bajajModel = await VehicleModel.findOne({ name: 'BAJAJ' });
    if (bajajModel) {
      const bajajStocks = await VehicleStock.find({ modelId: bajajModel._id });
      console.log('BAJAJ STOCKS:');
      bajajStocks.forEach(s => console.log(`- ${s.chassisNo} (${s.status})`));
    } else {
      console.log('BAJAJ model not found');
    }

    process.exit(0);
  })
  .catch(console.error);
