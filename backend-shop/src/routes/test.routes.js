const express = require("express");
const testController = require("../controllers/test.controller");

const router = express.Router();

router.get("/danhsach", testController.test);
module.exports = router;
