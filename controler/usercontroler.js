const fs = require('fs');
const user = require('../model/usersmodel');
const catchasyncerror = require('../utils/catchasyncerror');
const Apperror = require('../utils/apperror');

// filter ther the object for filtering the unwanted field that are not allowed to be updated
const filterobj = (obj, ...allowedfield) => {
  const newobj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedfield.includes(el)) newobj[el] = obj[el];
  });
  return newobj;
};

//  update the user data not password data
exports.updateMe = catchasyncerror(async (req, res, next) => {
  // 1) create error if user post password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new Apperror(400, 'this route is not for password update please use /updateMyPassword')
    );
  }
  // 2) filter the unwanted field that are not allowed to be updated
  const filteredbody = filterobj(req.body, 'name', 'email');
  // 3) update the user document
  const updateduser = await user.findByIdAndUpdate(req.user.id, filteredbody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updateduser,
    },
  });
});

// delete the user we are not deleting the user  we are making the active field to false so that the user can be reactivated
exports.deleteMe = catchasyncerror(async (req, res, next) => {
  await user.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

//  read the file and parse it to json
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
