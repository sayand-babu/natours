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

module.exports = APIfeatures;
