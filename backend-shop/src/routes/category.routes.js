const express = require("express");
const categoryController = require("../controllers/category.controller");
const {
  categoryValidator,
  updateStatusValidator,
  searchValidator,
} = require("../validators/category.validator");

const router = express.Router();

router.get("/", categoryController.layDanhSachDanhMuc);

router.get("/thong-ke/all", categoryController.thongKeDanhMuc);

router.get("/:id", categoryController.layChiTietDanhMuc);

router.post("/", categoryValidator, categoryController.taoDanhMuc);

router.put("/:id", categoryValidator, categoryController.capNhatDanhMuc);

router.delete("/:id", categoryController.xoaDanhMuc);

router.patch(
  "/:id/trang-thai",
  updateStatusValidator,
  categoryController.capNhatTrangThai
);

module.exports = router;
