/* eslint-disable node/no-unsupported-features/es-syntax */
const Tour = require('../model/tourmodel');

const topcheap = (req, res, next) => {
  req.query.sort = '-ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage';
  req.query.limit = '5';
  next();
};

// make a class for the api features
// Utility class for API features
class APIfeatures {
  constructor(query, queryString) {
    this.query = query; // Mongoose query
    this.queryString = queryString; // Express req.query
  }

  // 1. Filtering
  filter() {
    const queryObj = { ...this.queryString }; // copy req.query
    const exclude = ['limit', 'sort', 'page', 'fields'];
    exclude.forEach((el) => delete queryObj[el]);

    // Advanced filtering (gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));
    return this; // allow chaining
  }

  // 2. Sorting
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // default sort by createdAt descending
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // 3. Field limiting (projection)
  select() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // exclude __v by default
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // 4. Pagination
  pagingandlimiting() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this; // allow chaining
  }
}

const alltour = async (req, res) => {
  try {
    // // eslint-disable-next-line node/no-unsupported-features/es-syntax
    // const reqquery = { ...req.query }; // saving the req query
    // const exclude = ['limit', 'sort', 'page', 'fields']; // excluding values in the query
    // exclude.forEach((el) => delete reqquery[el]);

    // // when we pass the ?duration[gte]=5 we will get like this
    // // { duration: { gte: '3' }, difficulty: 'easy', page: '2' }
    // // we want like this
    // //{"duration":{"$gte":"3"},"difficulty":"easy"}
    // // we need to change the query so it is in the mongodb query format

    // let querystring = JSON.stringify(reqquery);
    // querystring = querystring.replace(
    //   /\b(lte|gte|lt|gt)\b/g,
    //   (match) => `$${match}`,
    // );
    // let query = Tour.find(JSON.parse(querystring));

    // // sorting

    // if (req.query.sort) {
    //   const sortby = req.query.sort.split(',').join(' ');
    //   query = query.sort(sortby);
    // }

    // // selecting fields
    // if (req.query.fields) {
    //   const selectby = req.query.fields.split(',').join(' ');
    //   query = query.select(selectby);
    // }

    // // paginng and limiting
    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page - 1) * limit;
    // query = query.skip(skip).limit(limit);
    // if (req.query.page) {
    //   const totaldocument = await Tour.countDocuments();
    //   if (page > totaldocument) throw new Error('there is no page');
    // }

    // execute query
    const features = new APIfeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .select()
      .pagingandlimiting();

    const tours = await features.query;

    // send the results
    res.status(200).json({
      status: 'success',
      result: tours.length,
      data: tours,
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      error: err,
    });
  }
};

const getstats = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      error: err,
    });
  }
};

const getmontlyreport = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      error: err,
    });
  }
};

// adding tour to collection
const addtour = async (req, res) => {
  // const newtour = new Tour(res.body)
  // newtour.save()

  try {
    const newtour = await Tour.create(req.body);
    res.status(200).json({
      status: 'success',
      description: newtour,
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      description: err,
    });
  }
};

// selecting the tour by id
const getatourbyid = async (req, res) => {
  try {
    const tourid = req.params.id;
    const tour = await Tour.findById(tourid);
    res.status(200).json({
      status: 'success',
      data: tour,
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      error: err,
    });
  }
};

// update the tour by id
const updatetourbyid = async (req, res) => {
  try {
    const tourid = req.params.id;
    const updatedtour = await Tour.findByIdAndUpdate(tourid, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: 'success',
      data: updatedtour,
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      error: err,
    });
  }
};

const deletetourbyid = async (req, res) => {
  try {
    const tourid = req.params.id;
    const deletedtour = await Tour.findByIdAndDelete(tourid);
    res.status(200).json({
      status: 'success',
      data: deletedtour,
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      error: err,
    });
  }
};

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
