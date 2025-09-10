const fs = require('fs');
const user = require('../model/usersmodel');
const catchasyncerror = require('../utils/catchasyncerror');

const userdata = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/users.json`, 'utf8'));

exports.getalluser = catchasyncerror(async (req, res) => {
  const users = await user.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.getuserbyid = (req, res) => {
  const id = req.params.id * 1;
  res.json(userdata[id]);
};

exports.checkid = (req, res, next, val) => {
  const { id } = req.params;
  if (id >= userdata.length) {
    console.log('user id does not exist ');
    return res.status(404).end('user not found');
  }
  console.log(`${val} is there we are fetching `);
  next();
};
// read the file
