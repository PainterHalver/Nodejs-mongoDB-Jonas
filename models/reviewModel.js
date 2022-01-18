const mongoose = require("mongoose");
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "A review is required!"],
    },
    rating: {
      type: Number,
      min: [1, "Rating must be >= 1.0"],
      max: [5, "Rating must be <= 5.0"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour!"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user!"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// An user cannot write multiple reviews for a tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// hooks must come before model
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: "user",
    select: "name photo",
  });

  next();
});

// static methods
reviewSchema.statics.calculateAverageRatings = async function(tourId) {
  // 'this' now points to the Model, that's why we need a static method
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// we want to calculate after saving not before so "post"
reviewSchema.post("save", function() {
  // 'this' points to current review document
  this.constructor.calculateAverageRatings(this.tour);
});

// findByIdAndUpdate calls findOneAndUpdate
// findByIdAndDelete calls findOneAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
  // 'this' is the query
  // now we need the tourId and somehow pass it to the post middleware
  this.review = await this.findOne();
  next();
});

// and we want to calculate after review is updated not before (tricky)
reviewSchema.post(/^findOneAnd/, async function(next) {
  // await this.findOne() does not work here because query has already executed
  await this.review.constructor.calculateAverageRatings(this.review.tour);
});

module.exports = mongoose.model("Review", reviewSchema);
