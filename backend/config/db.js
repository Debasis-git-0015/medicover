const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[DB] No MONGODB_URI provided in .env. Running in local db.json fallback mode.');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`=======================================================`);
    console.log(`🍃 Connected to MongoDB Atlas Cloud`);
    console.log(`🌐 Host: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
    console.log(`=======================================================`);
    return true;
  } catch (err) {
    console.warn(`[MONGODB ATLAS WARNING] Could not connect to Atlas (${err.message}). Using db.json fallback.`);
    return false;
  }
};

module.exports = connectDB;
