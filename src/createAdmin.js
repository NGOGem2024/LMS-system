const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Admin user details - you can modify these
const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'admin123',
  role: 'admin',
  tenantId: 'ngo' // Change this to the tenant you want to create the admin for
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Determine database name based on tenant ID
    const tenantDbMap = {
      'default': 'LearnMsDb',
      'ngo': 'NgoLms'
    };
    
    const dbName = tenantDbMap[adminUser.tenantId] || `${adminUser.tenantId}Db`;
    
    // Get base connection string without database name
    let baseUri = process.env.MONGO_URI;
    if (baseUri.includes('/LearnMsDb')) {
      baseUri = baseUri.replace('/LearnMsDb', '');
    }
    
    // Create connection string with the appropriate database name
    const connectionString = `${baseUri}/${dbName}`;
    
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host} - Database: ${dbName}`);
    return conn;
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

// Create admin user
const createAdminUser = async () => {
  try {
    await connectDB();
    
    // Import User model
    const User = require('./models/User');
    
    // Check if admin user already exists
    const existingUser = await User.findOne({ email: adminUser.email, tenantId: adminUser.tenantId });
    
    if (existingUser) {
      console.log(`Admin user with email ${adminUser.email} already exists`);
      process.exit(0);
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminUser.password, salt);
    
    // Create user
    const user = await User.create({
      name: adminUser.name,
      email: adminUser.email,
      password: hashedPassword,
      role: adminUser.role,
      tenantId: adminUser.tenantId
    });
    
    console.log(`Admin user created: ${user.name} (${user.email})`);
    process.exit(0);
  } catch (err) {
    console.error(`Error creating admin user: ${err.message}`);
    process.exit(1);
  }
};

// Run the script
createAdminUser(); 