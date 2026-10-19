const mongoose = require('mongoose');
const uri = "mongodb+srv://shivanshDB:shivanshdb01@shivanshdb.tolmx9u.mongodb.net/?appName=shivanshDb";

const LedgerSchema = new mongoose.Schema({}, { strict: false });
const LedgerModel = mongoose.models.Ledger || mongoose.model('Ledger', LedgerSchema);

async function run() {
  try {
    await mongoose.connect(uri);
    const res = await LedgerModel.deleteOne({ _id: '6a29928df77d08ac32cfb61d' });
    console.log("Deleted ledger:", res.deletedCount);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}
run();
