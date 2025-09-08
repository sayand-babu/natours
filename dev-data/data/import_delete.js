/* eslint-disable eqeqeq */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Tour = require('../../model/tourmodel');

// Load env vars
dotenv.config({ path: './configure.env' });
// Replace <db_password> placeholder in DATABASE with DATABASE_PASSWORD
const DB = process.env.DATABASE.replace(
  '<db_password>',
  process.env.DATABASE_PASSWORD,
);

// Connect to MongoDB
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful!'))
  .catch((err) => console.error('DB connection error:', err));
//  read the data from the file
const data = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf8'),
);
// make the function to delete all the data in the database
const deletedata = async () => {
  try {
    const dresponse = await Tour.deleteMany();
    console.log(dresponse);
  } catch (err) {
    console.log(err);
  }
};
// adding data to the database
const adddata = async () => {
  try {
    const resp = await Tour.create(data);
    console.log(resp);
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] == '--import') {
  adddata();
} else if (process.argv[2] == '--delete') {
  deletedata();
}
