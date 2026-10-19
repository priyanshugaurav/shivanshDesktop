const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin:admin@cluster0.zoxsh.mongodb.net/nexus?retryWrites=true&w=majority&appName=Cluster0')
.then(async () => {
    const Agreement = mongoose.connection.collection('agreements');
    const Collections = mongoose.connection.collection('collections');

    const agg = await Agreement.findOne({"payment.dues": "5000.00"});
    if (agg) {
        console.log("Found Agreement:", agg._id);
        console.log("Current netDues:", agg.payment.netDues);
        
        await Agreement.updateOne({_id: agg._id}, {$set: {"payment.netDues": "0"}});
        console.log("Updated netDues to 0");
    } else {
        console.log("Agreement not found");
    }
    
    process.exit(0);
});
