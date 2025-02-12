const mongoose = require("mongoose");
require('dotenv').config();

const uri = process.env.uri_removeINdex;
console.log("uri", uri);

async function removeIndex() {
    try {
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

        const Candidate = mongoose.model("Candidate", new mongoose.Schema({}), "candidates");

        await Candidate.collection.dropIndex("Email_1"); // Drop the Email_1 index
        console.log("✅ Index Email_1 removed successfully");

        mongoose.connection.close();
    } catch (error) {
        console.error("❌ Error removing index:", error.message);
    }
}

removeIndex();
