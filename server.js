const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});
const app = require('./app');

// Load env vars
dotenv.config({ path: './configure.env' });

// Replace <db_password> placeholder in DATABASE with DATABASE_PASSWORD
const DB = process.env.DATABASE.replace('<db_password>', process.env.DATABASE_PASSWORD);

// Connect to MongoDB
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful!'))
  .catch((err) => console.error('DB connection error:', err));

// Start server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App is running on port ${port} by ${process.env.AUTHOR}`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
