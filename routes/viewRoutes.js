const express = require("express");
const viewController = require("./../controllers/viewController");
const authController = require("./../controllers/authController");

const router = express.Router();

router.get("/me", authController.protect, viewController.getAccount);

// NOT REQUIRED TO LOGIN BUT JUST TO CHECK IF USER IS LOGGED IN OR NOT
router.use(authController.isLoggedIn);

router.get("/", viewController.getOverview);
router.get("/tour/:slug", viewController.getTour);
router.get("/login", viewController.getLoginForm);

router.post(
  "/submit-user-data",
  authController.protect,
  viewController.updateUserData
);

module.exports = router;
