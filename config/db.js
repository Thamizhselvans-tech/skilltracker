const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS resolvers for MongoDB Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('[DNS Warning]', dnsErr.message);
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ [MongoDB Error] MONGO_URI is not defined in .env file!');
    console.error('Please configure MONGO_URI in backend/.env with your MongoDB Atlas connection string.');
    return null;
  }

  if (uri.includes('<YOUR_PASSWORD>') || uri.includes('<db_password>')) {
    console.warn('\n======================================================');
    console.warn('⚠️ [MongoDB Atlas] Password placeholder detected in MONGO_URI.');
    console.warn('Please replace <YOUR_PASSWORD> with your actual MongoDB Atlas database user password in backend/.env.');
    console.warn('======================================================\n');
    return null;
  }

  try {
    const isAtlas = uri.includes('mongodb+srv') || uri.includes('.mongodb.net');
    console.log(`[MongoDB] Connecting to ${isAtlas ? 'MongoDB Atlas Cloud' : 'MongoDB Server'}...`);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      dbName: 'skilltracker',
    });

    console.log(`\n======================================================`);
    console.log(`✅ [MongoDB Atlas] Connected successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name || 'skilltracker'}`);
    console.log(`   ReadyState: ${conn.connection.readyState === 1 ? 'Connected (1)' : conn.connection.readyState}`);
    console.log(`======================================================\n`);

    return conn;
  } catch (error) {
    console.error(`\n======================================================`);
    console.error(`❌ [MongoDB Connection Error]: ${error.message}`);
    console.error(`   If using MongoDB Atlas:`);
    console.error(`   1. Verify your Atlas IP Access List (Network Access -> Add IP Address 0.0.0.0/0)`);
    console.error(`   2. Verify your Database User credentials in MONGO_URI`);
    console.error(`   3. Ensure database name "skilltracker" is specified`);
    console.error(`======================================================\n`);
    return null;
  }
};

module.exports = connectDB;
