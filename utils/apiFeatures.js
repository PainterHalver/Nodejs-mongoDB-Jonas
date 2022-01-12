class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1A. FILTERING
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((e) => {
      delete queryObj[e];
    });

    // 1B. ADVANCED FILTERING
    // filter object in plain mongoDB:
    // { difficulty: 'easy', duration: { $gte: 5 } }
    // req.query of 127.0.0.1:3000/api/v1/tours/?duration[gte]=5&difficulty=easy
    // { difficulty: 'easy', duration: { gte: 5 } }
    // so we just need to replace operators like 'gte' with '$gte', HERE BE REGEX :)
    // gte, gt, lte, lt
    const queryString = JSON.stringify(queryObj).replace(
      /\b(gte|gt|lte|lt)\b/g,
      (matchedString) => `$${matchedString}`
    );

    this.query = this.query.find(JSON.parse(queryString));

    return this;
  }

  sort() {
    // 2. SORTING
    if (this.queryString.sort) {
      // 127.0.0.1:3000/api/v1/tours/?sort=-price,ratingsAverage
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy); // query is a Query object in mongoose| == query.sort("price rating")
    } else {
      // default sorting
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  limitFields() {
    // 3. FIELD LIMITING
    if (this.queryString.fields) {
      this.query = this.query.select(
        this.queryString.fields.split(",").join(" ")
      ); // query.select('name duration price')
    } else {
      // default (ex hide '__v')
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate() {
    // 4. PAGINATION
    // 127.0.0.1:3000/api/v1/tours/?page=2&limit=10
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 100;
    const skipValue = (page - 1) * limit;
    this.query = this.query.skip(skipValue).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
