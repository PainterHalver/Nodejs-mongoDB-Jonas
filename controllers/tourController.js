const { listeners } = require("./../models/tourModel");
const Tour = require("./../models/tourModel");

exports.getAllTours = async (req, res) => {
  try {
    // BUILD QUERY SO WE CAN CHAIN METHODS
    // 1A. FILTERING
    const queryObj = { ...req.query };
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

    let query = Tour.find(JSON.parse(queryString));

    // 2. SORTING
    if (req.query.sort) {
      // 127.0.0.1:3000/api/v1/tours/?sort=-price,ratingsAverage
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy); // query is a Query object in mongoose| == query.sort("price rating")
    } else {
      // default sorting
      query = query.sort("-createdAt");
    }

    // EXECUTE QUERY WITH 'await'
    const tours = await query;

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id); // === Tour.findOne({ _id: req.params.id })

    res.status(200).json({
      status: "success",
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    // const newTour = new Tour({})
    // newTour.save()

    const newTour = await Tour.create(req.body);

    res.status(200).json({
      status: "success",
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: "Invalid data sent!",
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: "INVALID UPDATE DATA",
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndRemove(req.params.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};
