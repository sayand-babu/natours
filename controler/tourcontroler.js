/* eslint-disable node/no-unsupported-features/es-syntax */
const Tour = require('../model/tourmodel');
const APIfeatures = require('../utils/apifeaures');
const catchasyncerror = require('../utils/catchasyncerror');
const Apperror = require('../utils/apperror');

const topcheap = (req, res, next) => {
  req.query.sort = '-ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage';
  req.query.limit = '5';
  next();
};

const alltour = catchasyncerror(async (req, res, next) => {
  const features = new APIfeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .select()
    .pagingandlimiting();

  const tours = await features.query;
  if (!tours) {
    return next(new Apperror(404, 'tour not found'));
  }

  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: tours,
  });
});

const getstats = catchasyncerror(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4 } },
    },
    {
      $group: {
        _id: '$difficulty',
        avgrating: { $avg: '$ratingsAverage' },
        avgprice: { $avg: '$price' },
        maxprice: { $max: '$price' },
        minprice: { $min: '$price' },
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

const getmontlyreport = catchasyncerror(async (req, res) => {
  const year = req.params.year * 1;
  const monthly = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        toaltours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { toaltours: -1 },
    },
    {
      $limit: 6,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: monthly,
  });
});

// adding tour to collection
const addtour = catchasyncerror(async (req, res) => {
  const newtour = await Tour.create(req.body);
  res.status(200).json({
    status: 'success',
    description: newtour,
  });
});

// selecting the tour by id
const getatourbyid = catchasyncerror(async (req, res, next) => {
  const tourid = req.params.id;
  const tour = await Tour.findById(tourid);
  if (!tour) {
    return next(new Apperror(404, 'tour not found'));
  }
  res.status(200).json({
    status: 'success',
    data: tour,
  });
});

// update the tour by id
const updatetourbyid = catchasyncerror(async (req, res) => {
  const tourid = req.params.id;
  const updatedtour = await Tour.findByIdAndUpdate(tourid, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: updatedtour,
  });
});

const deletetourbyid = catchasyncerror(async (req, res, next) => {
  const tourid = req.params.id;
  const deletedtour = await Tour.findByIdAndDelete(tourid);
  if (!deletedtour) {
    return next(new Apperror(404, 'tour not found'));
  }
  res.status(200).json({
    status: 'success',
    data: deletedtour,
  });
});

module.exports = {
  addtour: addtour,
  gettourbyid: getatourbyid,
  updatetourbyid: updatetourbyid,
  alltour: alltour,
  deletetourbyid: deletetourbyid,
  topcheap: topcheap,
  getstats: getstats,
  getmontlyreport: getmontlyreport,
};
