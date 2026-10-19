const mongoose = require('mongoose');
mongoose.connect('').catch(err => console.log('caught error'));
mongoose.model('User', new mongoose.Schema({ name: String })).findOne({}).then(console.log).catch(console.error);
console.log('Query started, waiting...');
