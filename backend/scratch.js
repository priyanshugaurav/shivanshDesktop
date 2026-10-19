const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin:admin@cluster0.zoxsh.mongodb.net/nexus?retryWrites=true&w=majority&appName=Cluster0')
.then(async () => {
    const Agreement = mongoose.connection.collection('agreements');
    const Collections = mongoose.connection.collection('collections');

    const aggs = await Agreement.find({"payment.dues": "5000.00"}).toArray();
    console.log("Agreements with dues 5000:", aggs.map(a => ({_id: a._id, payment: a.payment})));

    for(let agg of aggs) {
        const cols = await Collections.find({ agreementId: agg._id }).toArray();
        console.log("Collections for", agg._id, cols);
    }
    
    process.exit(0);
});
