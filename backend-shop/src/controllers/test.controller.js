const express = require("express");
const router = express.Router();
const { test } = require("../services/test.service");
const paymentService = require("../services/payment.service");

// Test route
class TestController {
  async test(req, res) {
    try {
      const result = await test();
      res.status(200).json({ message: "Test successful", data: result });
    } catch (error) {
      console.error("Error in test controller:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }
}

module.exports = new TestController();
