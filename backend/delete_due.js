const mongoose = require('mongoose');

const uri = "mongodb+srv://shivanshDB:shivanshdb01@shivanshdb.tolmx9u.mongodb.net/?appName=shivanshDb";

const CollectionSchema = new mongoose.Schema({
  amount: Number,
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
}, { collection: 'collections' }); // to match the collection name

const CustomerSchema = new mongoose.Schema({
  personal: {
    firstName: String,
    lastName: String
  }
});

const CollectionModel = mongoose.model('Collection', CollectionSchema);
const CustomerModel = mongoose.model('Customer', CustomerSchema);

async function run() {
  try {
    await mongoose.connect(uri);
    
    const gautams = await CustomerModel.find({ 'personal.firstName': /GAUTAM/i });
    if (gautams.length === 0) {
      console.log("No Gautam found");
      process.exit();
    }
    
    const customerIds = gautams.map(g => g._id);
    console.log("Found customer IDs:", customerIds);
    
    const collections = await CollectionModel.find({ customerId: { $in: customerIds } });
    console.log("Collections for Gautam:", collections);

    const result = await CollectionModel.deleteMany({
      amount: 25000,
      customerId: { $in: customerIds }
    });
    
    console.log("Deleted", result.deletedCount, "records");
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}
run();
