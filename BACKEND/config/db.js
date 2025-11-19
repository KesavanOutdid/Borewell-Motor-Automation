// BACKEND/config/db.js
const mongoose = require('mongoose');

async function connectDB() {
    const baseUrl = process.env.MONGODB_URL;
    const dbName = process.env.DB_NAME || 'Borewell_Motor_Automation';
    if (!baseUrl) {
        console.error('MONGODB_URL missing in .env');
        process.exit(1);
    }
    const uri = `${baseUrl}/${dbName}?retryWrites=true&w=majority`;

    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected using Mongoose');
    } catch (err) {
        console.error('DB Connection Error:', err.message || err);
        process.exit(1);
    }
}

module.exports = connectDB;
