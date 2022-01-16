const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "A tour name must have <= 40 characters"],
      minLength: [10, "A tour name must have >= 10 characters"],
      // validate: [validator.isAlpha, "A tour name must only contain characters"],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium, difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be >= 1.0"],
      max: [5, "Rating must be <= 5.0"],
    },
    ratingsQuantity: {
      type: Number,
      dafault: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(value) {
          // 'this' is the current document
          // 'this' only available on NEW document creation, not update
          // 'value' is the value inputted for 'priceDiscount'
          return value < this.price;
        },
        message: "Discount price ({VALUE}) should be < price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: {
      type: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON needs at least type and coordinates
      type: {
        type: String,
        default: "Point", // Polygon, Rectangle...
        enum: ["Point"],
      },
      coordinates: [Number], // [longitude, latitude]
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId, // This is how we do referencing in mongoose
        ref: "User",
      },
    ],
  },
  {
    // for virtual properties to showup when calling api
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// DOCUMENT MIDDLEWARE
// Add virtual properties to Schema.
// callback must be function() {} for 'this' keyword
// virtual cannot be accessed in controllers
tourSchema.virtual("durationWeeks").get(function() {
  // 'this' is the document
  return this.duration / 7;
});

// pre hook (mongoose middleware)
// callback must be function() {} for 'this' keyword
// 'save' hook is only for .save() and .create() not for .createMany() or findBy..AndUpdate()
tourSchema.pre("save", function(next) {
  // 'this' is the currently saving document ()
  this.slug = slugify(this.name, { lower: true });
  next();
});

// post hook
tourSchema.post("save", function(doc, next) {
  // no longer have 'this' but now we have 'doc'
  next();
});

// QUERY MIDDLEWARE
// Create pre middleware for all hooks that starts with 'find' (find, findOne, findById...)
tourSchema.pre(/^find/, function(next) {
  // 'this' is the query
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  });
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start}ms!`);
  next();
});

// AGGREGATION MIDDLEWARE
// Remove secret tours from aggregation pipeline
tourSchema.pre("aggregate", function(next) {
  // 'this' is the aggregation object
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

module.exports = mongoose.model("Tour", tourSchema);
