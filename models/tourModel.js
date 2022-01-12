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
  },
  {
    // for virtual properties to showup when calling api
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add virtual properties to Schema.
// callback must be function() {} for 'this' keyword
// virtual cannot be accessed in controllers
tourSchema.virtual("durationWeeks").get(function () {
  // 'this' is the document
  return this.duration / 7;
});

// pre hook (mongoose middleware)
// callback must be function() {} for 'this' keyword
// 'save' hook is only for .save() and .create() not for .createMany() or findBy..AndUpdate()
tourSchema.pre("save", function (next) {
  // 'this' is the currently saving document ()
  this.slug = slugify(this.name, { lower: true });
  next();
});

// post hook
tourSchema.post("save", function (doc, next) {
  // no longer have 'this' but now we have 'doc'
  next();
});

module.exports = mongoose.model("Tour", tourSchema);
