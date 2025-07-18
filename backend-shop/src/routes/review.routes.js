const express = require("express");
const router = express.Router();
const ReviewController = require("../controllers/review.controller");

router.post("/", ReviewController.themDanhGia);
router.get("/", ReviewController.layDanhSachDanhGia);


module.exports = router;