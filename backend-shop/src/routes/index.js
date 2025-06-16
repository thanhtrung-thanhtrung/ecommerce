const express = require("express");
const router = express.Router();

// Import các routes
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const productRoutes = require("./product.routes");
const cartRoutes = require("./cart.routes");
const orderRoutes = require("./order.routes");
const paymentRoutes = require("./payment.routes");
const categoryRoutes = require("./category.routes");
const brandRoutes = require("./brand.routes");
const shippingRoutes = require("./shipping.routes");
//const inventoryRoutes = require("./inventory.routes");
// Định nghĩa các routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/categories", categoryRoutes);
router.use("/brands", brandRoutes);
router.use("/shipping", shippingRoutes);
// router.use("/inventory", inventoryRoutes);

module.exports = router;
