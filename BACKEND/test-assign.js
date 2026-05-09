const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
    await mongoose.connect('mongodb+srv://outdid:outdid@cluster0.t16a63a.mongodb.net/Borewell_Motor_Automation');
    const Sim = require('./models/Sim');
    const sim = await Sim.findById("69fd7ec8a554ee2bf052cd7f");
    console.log("Sim:", sim);
    try {
        if(sim) {
            sim.assign_status = true;
            await sim.save();
        }
        console.log("Saved successfully");
    } catch (e) {
        console.log("Validation Error:", e.message);
    }
    process.exit();
}
test();
