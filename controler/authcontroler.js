const jwt = require('jsonwebtoken');
const utils = require('util');
const users = require('../model/usersmodel');
const asyncHandler = require('../utils/catchasyncerror');
const Apperror = require('../utils/apperror');

const tokengenerataion = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
// signup controller
exports.signup = asyncHandler(async (req, res, next) => {
  const newUser = await users.create(req.body);
  res.status(201).json({
    status: 'success',
    data: newUser,
  });
});

// login controller
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) check if email and password exist in the request body
  if (!email || !password) return next(new Apperror(400, 'please provide email and password'));

  // 2) check if user exist and password is correct
  const user = await users.findOne({ email: email }).select('+password');
  if (!user || !user.correctPassword(password, user.password)) {
    return next(new Apperror(401, 'incorrect email or password'));
  }

  // genrate the token
  const token = tokengenerataion(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

// protect middleware  verify that the user is logged in

exports.protect = asyncHandler(async (req, res, next) => {
  // 1) check if the token exis
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2) if token is not there
  if (!token) {
    return next(new Apperror(401, 'you are not logged in please log in to get access'));
  }
  // 3) verification of the token

  const decoded = await utils.promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 4) check if the user still exist
  const currentuser = await users.findById(decoded.id);
  if (!currentuser) {
    return next(new Apperror(401, 'the user belonging to this token does no longer exist'));
  }
  // chekc if the user changed password after the token was issued
  if (currentuser.changedPasswordAfter(decoded.iat)) {
    return next(new Apperror(401, 'user recently changed password please log in again'));
  }
  // give access to the protected route
  req.user = currentuser;
  next();
});

// restrict middleware to restrict certain routes to certain users only based on the role
exports.restrict = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new Apperror(403, 'you do not have permission to perform this action'));
    }
    next();
  };
};

// forgot password controller
exports.forgotpassword = asyncHandler(async (req, res, next) => {
  // 1) get user based on posted email
  const user = await users.findOne({ email: req.body.email });
  if (!user) {
    return next(new Apperror(404, 'there is no user with that email address'));
  }

  // 2) generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) send it to user's email

  //
  res.status(200).json({
    status: 'success',
    message: 'token sent to email',
    resetToken,
  });
});
