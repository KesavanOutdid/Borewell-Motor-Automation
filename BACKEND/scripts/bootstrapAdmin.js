// BACKEND/scripts/bootstrapAdmin.js
require('dotenv').config();
const connectDB = require('../config/db');
const Role = require('../models/Role');
const User = require('../models/User');
const bcrypt = require('bcrypt');

async function run() {
    await connectDB();

    // ensure ADMIN role exists
    const adminRole = await Role.findOneAndUpdate(
        { role_id: 'ADMIN' },
        { role_id: 'ADMIN', role_name: 'Administrator', status: true },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const email = 'admin@local';
    const existing = await User.findOne({ user_email: email });
    if (!existing) {
        const hashed = await bcrypt.hash('Admin@123', 10);
        await User.create({
            user_id: 'admin-1',
            user_name: 'Super Admin',
            role_id: 'ADMIN',
            user_email: email,
            password: hashed,
            status: true,
            createdBy: 'system'
        });
        console.log('Admin user created -> email:', email, 'password: Admin@123');
    } else {
        console.log('Admin user already exists:', email);
    }

    console.log('Bootstrap complete');
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
