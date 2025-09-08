const mongoose = require('mongoose');
const dotenv = require('dotenv');
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
app.listen(port, () => {
  console.log(`App is running on port ${port} by ${process.env.AUTHOR}`);
});
