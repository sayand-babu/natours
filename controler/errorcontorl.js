/* eslint-disable camelcase */
const Apperror = require('../utils/apperror');

// handling  cast error from the db
const handlecasterrordb = (err) => {
  const message = `invalid ${err.path} : ${err.value}`;
  return new Apperror(400, message);
};

const handleDuplicateerrordb = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `duplicate field value : ${value} please use another value`;
  return new Apperror(400, message);
};

// handle validation error
const handlevalidationerrordb = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `invalid input data. ${errors.join('. ')}`;
  return new Apperror(400, message);
};
// if the error is productional error

const Production_Error = (err, res) => {
  if (err.isOperational) {
    res.status(err.statuscode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // log the error
    console.error('the error is', err);
    // send generic message
    res.status(500).json({
      status: 'error',
      message: 'something went wrong',
    });
  }
};

// if the error is developemental error

const development_error = (err, res) => {
  res.status(err.statuscode).json({
    status: err.status,
    message: err.message,
    errstack: err.stack,
    err: err,
  });
};

module.exports = (err, req, res, next) => {
  err.status = err.status || 'failed';
  err.statuscode = err.statuscode || 500;
  if (process.env.NODE_ENV === 'DEVELOPMENT') development_error(err, res);
  else if (process.env.NODE_ENV === 'PRODUCTION') {
    let error = err;
    if (err.name === 'CastError') error = handlecasterrordb(err);
    if (err.code === 11000) error = handleDuplicateerrordb(err);
    if (err.name === 'ValidationError') error = handlevalidationerrordb(err);
    Production_Error(error, res);
  }
};
