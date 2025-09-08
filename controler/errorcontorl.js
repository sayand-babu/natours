/* eslint-disable camelcase */
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
    Production_Error(err, res);
  }
};
