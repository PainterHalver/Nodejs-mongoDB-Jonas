const mongoose = require("mongoose");
const slugify = require("slugify");
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
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
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      dafault: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: Number,
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

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Query tool ${Date.now() - this.start}ms!`);
  next();
});

module.exports = mongoose.model("Tour", tourSchema);
