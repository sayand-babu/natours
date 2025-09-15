const jwt = require('jsonwebtoken');
const utils = require('util');
const crypto = require('crypto');
const users = require('../model/usersmodel');
const asyncHandler = require('../utils/catchasyncerror');
const Apperror = require('../utils/apperror');
const sendemail = require('../utils/emailservice');

const tokengenerataion = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//send response with token
const sendtoken = (user, statuscode, res) => {
  const token = tokengenerataion(user._id);
  res.status(statuscode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
// signup controller
exports.signup = asyncHandler(async (req, res, next) => {
  const newUser = await users.create(req.body);
  sendtoken(newUser, 201, res);
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
  // 3) if everything is ok send the token to the client
  sendtoken(user, 200, res);
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

// forgot password controller ################
exports.forgotpassword = asyncHandler(async (req, res, next) => {
  // 1) get user based on posted email
  const user = await users.findOne({ email: req.body.email });
  // if the user doesnt exist return error
  if (!user) {
    return next(new Apperror(404, 'there is no user with that email address'));
  }

  // 2) generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // it will remove all the validator and save the user

  // send a  router link to the users with  the token as a paramter
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/user/resetpassword/${resetToken}`;
  const message = `forgot your password? submit a patch request with your new password and passwordconfirm to : ${resetURL}.\n if you didn't forget your password please ignore this email`;

  try {
    await sendemail({
      email: user.email,
      subject: 'your password reset token (valid for 10 min)',
      message,
    });
    // 3) send it to user's email
    res.status(200).json({
      status: 'success',
      message: 'token sent to email',
      resetToken,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new Apperror(500, 'there was an error sending the email. try again later!'));
  }
});

// reset password controller ################
exports.resetpassword = asyncHandler(async (req, res, next) => {
  // encrypt the token then compare it to the one in the database
  const hashedtoken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await users.findOne({ passwordResetToken: hashedtoken });
  // if the user is not found return error
  if (!user) {
    return next(new Apperror(400, 'invalid token'));
  }
  // check if the token has expired
  if (user.passwordResetExpires < Date.now()) {
    return next(new Apperror(400, 'token has expired'));
  }
  // update changedPasswordAt property for the user
  user.password = req.password;
  user.passwordConfirm = req.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  sendtoken(user, 200, res);
});

// updatepassword
exports.updatepassword = asyncHandler(async (req, res, next) => {
  // 1) get user from the collection
  const user = await users.findById(req.user.id).select('+password');
  // 2) check if posted current password is correct
  if (!(await user.correctPassword(req.body.currentpassword, user.password))) {
    return next(new Apperror(401, 'your current password is wrong'));
  }
  // 3) if so update the password
  user.password = req.body.newpassword;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4) log the user in send JWT
  sendtoken(user, 200, res);
});
