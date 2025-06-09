const { validationResult } = require("express-validator");
const productService = require("../services/product.service");

class ProductController {
  async getAllProducts(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await productService.getAllProducts(
        parseInt(page),
        parseInt(limit)
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async searchProducts(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { page = 1, limit = 10 } = req.query;
      const result = await productService.searchProducts(
        req.body,
        parseInt(page),
        parseInt(limit)
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getProductDetail(req, res) {
    try {
      const { maSanPham } = req.params;
      const product = await productService.getProductDetail(maSanPham);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async reviewProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { maSanPham } = req.params;
      const updatedProduct = await productService.reviewProduct(
        maSanPham,
        req.user.userId,
        req.body
      );
      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new ProductController();
