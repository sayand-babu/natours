class Apperror extends Error {
  constructor(statuscode, message) {
    super(message);
    this.status = `${statuscode}`.startsWith('4') ? 'fail' : 'error';
    this.statuscode = statuscode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = Apperror;
