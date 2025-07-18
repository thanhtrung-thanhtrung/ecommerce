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
const voucherRoutes = require("./voucher.routes");
const inventoryRoutes = require("./inventory.routes");
const supplierRoutes = require("./supplier.routes");
const wishlistRoutes = require("./wishlist.routes");
const revenueRoutes = require("./revenue.routes");
const emailRoutes = require("./email.routes");
const testRoutes = require("./test.routes");
const  reviewRoutes = require("./review.routes");
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
router.use("/vouchers", voucherRoutes);
router.use("/wishlists", wishlistRoutes);
router.use("/email", emailRoutes);
router.use("/test", testRoutes);
router.use("/reviews", reviewRoutes);
//admin routes

router.use("/inventory", inventoryRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/revenue", revenueRoutes);

module.exports = router;
