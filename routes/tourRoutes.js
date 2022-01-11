const express = require("express");
const tourController = require("./../controllers/tourController");

const router = express.Router();

// Param Middleware (keyword is 'param', not 'use' but it is a middleware)
// router.param("id", tourController.checkID);

router
  .route("/")
  .get(tourController.getAllTours)
  .post(tourController.createTour);

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
