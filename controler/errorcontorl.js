module.exports = (_err, req, res, next) => {
  _err.status = _err.status || 'failed';
  _err.statuscode = _err.statuscode || 500;
  res.status(_err.statuscode).json({
    status: _err.status,
    message: _err.message,
  });
};
