const express = require("express");
const router = express.Router();
const shippingController = require("../controllers/shipping.controller");
const shippingValidator = require("../validators/shipping.validator");
const {
  verifyToken,
  checkAdminRole,
} = require("../middlewares/auth.middleware");



router.get("/active", shippingController.getAllActiveShippingMethods);

router.get("/options", shippingController.getShippingOptions);

router.post(
  "/calculate",
  shippingValidator.calculateShippingFee(),
  shippingController.calculateShippingFee
);

router.get(
  "/",
  shippingValidator.getShippingMethods(),
  shippingController.getShippingMethods
);

router.get(
  "/:id",
  shippingValidator.getShippingMethodById(),
  shippingController.getShippingMethodById
);

router.post(
  "/",
  verifyToken,
  checkAdminRole(),
  shippingValidator.createShippingMethod(),
  shippingController.createShippingMethod
);

router.put(
  "/:id",
  verifyToken,
  checkAdminRole(),
  shippingValidator.updateShippingMethod(),
  shippingController.updateShippingMethod
);

router.patch(
  "/:id/trang-thai",
  verifyToken,
  checkAdminRole(),
  shippingValidator.updateShippingStatus(),
  shippingController.updateShippingStatus
);

router.delete(
  "/:id",
  verifyToken,
  checkAdminRole(),
  shippingValidator.hardDeleteShippingMethod(),
  shippingController.hardDeleteShippingMethod
);

module.exports = router;
