const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'], // all the  users must have an email
    unique: true, // it is a validator  all the emails must be different
    lowercase: true, // convert email to lowercase
    trim: true, // remove whitespace
    validate: {
      validator: validator.isEmail, // use validator package to validate email
      message: 'Please provide a valid email',
    },
  },
  photo: {
    type: String,
    default: 'default.jpg', // default photo if none is provided
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'], // only these values are allowed
    default: 'user', // default role is user if none is provided
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: 8,
    select: false, // do not return password field in any output
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// pre save middleware to hash the password before saving it to the database only work when we save and create a new user
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000; // set the passwordChangedAt to 1 second before the current time to ensure the token is always created after the password has been changed
  next();
});

// instance method to check if the password is correct
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// check if the user changed password after the token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // if passwordChangedAt  is never changed there is no value for the  psswordChangedAt field
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp; // true means password was changed after the token was issued
  }
  // False means NOT changed
  return false;
};

// instance method to create password reset token
userSchema.methods.createPasswordResetToken = function () {
  // gnerate the random token 32 bytes , convert to hex string
  const resetToken = crypto.randomBytes(32).toString('hex');
  // hash the token and set to passwordResetToken field
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  // set the expire time 10 minutes from now
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

// create the model and export it
const User = mongoose.model('User', userSchema);
module.exports = User;
