const fs = require('fs');

const userdata = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/users.json`, 'utf8'));

exports.getalluser = (req, res) => {
  res.json(userdata);
};

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
