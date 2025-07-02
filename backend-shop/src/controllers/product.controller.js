const { validationResult } = require("express-validator");
const productService = require("../services/product.service");

class ProductController {
  // Lấy danh sách sản phẩm (public)
  async getAllProducts(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

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

  // Tìm kiếm sản phẩm (public)
  async searchProducts(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { page = 1, limit = 10 } = req.query;
      const result = await productService.searchProducts(
        req.query,
        parseInt(page),
        parseInt(limit)
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Lấy chi tiết sản phẩm (public)
  async getProductDetail(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId } = req.params;
      const product = await productService.getProductDetail(
        parseInt(productId)
      );
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Đánh giá sản phẩm (yêu cầu đăng nhập)
  async reviewProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId } = req.params;
      // Sử dụng ID người dùng nếu có, nếu không thì dùng ID mặc định (1 cho user thông thường)
      const userId = req.user?.userId || 1;

      const updatedProduct = await productService.reviewProduct(
        parseInt(productId),
        userId,
        req.body
      );
      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Tạo sản phẩm mới (admin)
  async createProduct(req, res) {
    try {
      // Xử lý thông tin sản phẩm từ req.body
      const productData = { ...req.body };

      // Xử lý các file đã upload nếu có
      if (req.files && req.files.length > 0) {
        // Tạo đối tượng hình ảnh
        productData.hinhAnh = {};

        // Khi sử dụng upload.any(), req.files là một mảng đối tượng file
        const anhChinhFiles = req.files.filter(
          (file) =>
            file.fieldname === "hinhAnh.anhChinh" ||
            file.fieldname === "anhChinh" ||
            file.fieldname === "hinhAnh"
        );

        const anhPhuFiles = req.files.filter(
          (file) =>
            file.fieldname === "hinhAnh.anhPhu" || file.fieldname === "anhPhu"
        );

        // Xử lý ảnh chính
        if (anhChinhFiles.length > 0) {
          productData.hinhAnh.anhChinh = anhChinhFiles[0];
        }

        // Xử lý ảnh phụ
        if (anhPhuFiles.length > 0) {
          productData.hinhAnh.anhPhu = anhPhuFiles;
        }
      }

      // Xử lý biến thể - cải tiến xử lý JSON
      if (productData.bienThe) {
        if (typeof productData.bienThe === "string") {
          try {
            productData.bienThe = JSON.parse(productData.bienThe);
            // Nếu parse thành công nhưng không phải mảng, chuyển thành mảng
            if (!Array.isArray(productData.bienThe)) {
              if (typeof productData.bienThe === "object") {
                productData.bienThe = [productData.bienThe];
              } else {
                throw new Error("bienThe phải là mảng các đối tượng biến thể");
              }
            }
          } catch (e) {
            console.error("Error parsing bienThe:", e);
            return res.status(400).json({
              errors: [
                {
                  type: "field",
                  value: productData.bienThe,
                  msg: "Phải có ít nhất một biến thể sản phẩm và phải ở định dạng JSON hợp lệ",
                  path: "bienThe",
                  location: "body",
                },
              ],
            });
          }
        } else if (!Array.isArray(productData.bienThe)) {
          // Nếu không phải chuỗi và không phải mảng
          if (typeof productData.bienThe === "object") {
            productData.bienThe = [productData.bienThe];
          } else {
            return res.status(400).json({
              errors: [
                {
                  type: "field",
                  value: productData.bienThe,
                  msg: "Phải có ít nhất một biến thể sản phẩm",
                  path: "bienThe",
                  location: "body",
                },
              ],
            });
          }
        }

        // Kiểm tra mảng có phần tử không
        if (!productData.bienThe || productData.bienThe.length === 0) {
          return res.status(400).json({
            errors: [
              {
                type: "field",
                value: productData.bienThe,
                msg: "Phải có ít nhất một biến thể sản phẩm",
                path: "bienThe",
                location: "body",
              },
            ],
          });
        }
      } else {
        return res.status(400).json({
          errors: [
            {
              type: "field",
              value: productData.bienThe,
              msg: "Phải có ít nhất một biến thể sản phẩm",
              path: "bienThe",
              location: "body",
            },
          ],
        });
      }

      // Chuyển đổi dữ liệu ThongSoKyThuat từ JSON string thành object nếu cần
      if (typeof productData.ThongSoKyThuat === "string") {
        try {
          productData.ThongSoKyThuat = JSON.parse(productData.ThongSoKyThuat);
        } catch (e) {
          console.error("Error parsing ThongSoKyThuat:", e);
        }
      }

      // Bây giờ mới kiểm tra lỗi validation sau khi đã xử lý dữ liệu
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Sử dụng ID người dùng nếu có, nếu không thì dùng ID mặc định (1 cho admin)
      const userId = req.user?.id || 1;

      const result = await productService.createProduct(productData, userId);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error in createProduct controller:", error);
      res.status(500).json({ message: error.message });
    }
  }

  // Cập nhật thông tin sản phẩm (admin)
  async updateProduct(req, res) {
    try {
      // Sử dụng ID người dùng nếu có, nếu không thì dùng ID mặc định (1 cho admin)
      const userId = req.user?.id || 1;
      const { id } = req.params;

      // Xử lý thông tin sản phẩm từ req.body
      const productData = { ...req.body };

      // Xử lý các file đã upload nếu có
      if (req.files && req.files.length > 0) {
        // Tạo đối tượng hình ảnh
        productData.hinhAnh = {};

        // Khi sử dụng upload.any(), req.files là một mảng đối tượng file
        const anhChinhFiles = req.files.filter(
          (file) =>
            file.fieldname === "hinhAnh.anhChinh" ||
            file.fieldname === "anhChinh" ||
            file.fieldname === "hinhAnh"
        );

        const anhPhuFiles = req.files.filter(
          (file) =>
            file.fieldname === "hinhAnh.anhPhu" || file.fieldname === "anhPhu"
        );

        // Xử lý ảnh chính
        if (anhChinhFiles.length > 0) {
          productData.hinhAnh.anhChinh = anhChinhFiles[0];
        }

        // Xử lý ảnh phụ
        if (anhPhuFiles.length > 0) {
          productData.hinhAnh.anhPhu = anhPhuFiles;
        }
      }

      // Xử lý biến thể - cải tiến xử lý JSON
      if (productData.bienThe) {
        if (typeof productData.bienThe === "string") {
          try {
            productData.bienThe = JSON.parse(productData.bienThe);
            // Nếu parse thành công nhưng không phải mảng, chuyển thành mảng
            if (!Array.isArray(productData.bienThe)) {
              if (typeof productData.bienThe === "object") {
                productData.bienThe = [productData.bienThe];
              } else {
                throw new Error("bienThe phải là mảng các đối tượng biến thể");
              }
            }
          } catch (e) {
            console.error("Error parsing bienThe:", e);
            return res.status(400).json({
              errors: [
                {
                  type: "field",
                  value: productData.bienThe,
                  msg: "Biến thể sản phẩm phải ở định dạng JSON hợp lệ",
                  path: "bienThe",
                  location: "body",
                },
              ],
            });
          }
        } else if (!Array.isArray(productData.bienThe)) {
          // Nếu không phải chuỗi và không phải mảng
          if (typeof productData.bienThe === "object") {
            productData.bienThe = [productData.bienThe];
          } else {
            return res.status(400).json({
              errors: [
                {
                  type: "field",
                  value: productData.bienThe,
                  msg: "Biến thể sản phẩm phải là mảng hợp lệ",
                  path: "bienThe",
                  location: "body",
                },
              ],
            });
          }
        }
      }

      // Chuyển đổi dữ liệu ThongSoKyThuat từ JSON string thành object nếu cần
      if (typeof productData.ThongSoKyThuat === "string") {
        try {
          productData.ThongSoKyThuat = JSON.parse(productData.ThongSoKyThuat);
        } catch (e) {
          console.error("Error parsing ThongSoKyThuat:", e);
          return res.status(400).json({
            errors: [
              {
                type: "field",
                value: productData.ThongSoKyThuat,
                msg: "Thông số kỹ thuật phải ở định dạng JSON hợp lệ",
                path: "ThongSoKyThuat",
                location: "body",
              },
            ],
          });
        }
      }

      // Bây giờ mới kiểm tra lỗi validation sau khi đã xử lý dữ liệu
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await productService.updateProduct(
        id,
        productData,
        userId
      );
      res.json(result);
    } catch (error) {
      console.error("Error in updateProduct controller:", error);
      res.status(500).json({ message: error.message });
    }
  }

  // Xóa sản phẩm (admin)
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ message: "ID sản phẩm không được cung cấp" });
      }

      const result = await productService.deleteProduct(parseInt(id));
      res.json(result);
    } catch (error) {
      console.error("Error in deleteProduct controller:", error);
      
      // Kiểm tra loại lỗi để trả về status code phù hợp
      if (error.message.includes("không tồn tại")) {
        return res.status(404).json({ message: error.message });
      }
      
      if (error.message.includes("đã có khách hàng mua")) {
        return res.status(400).json({ 
          message: error.message,
          cannotDelete: true,
          suggestion: "Bạn có thể ẩn sản phẩm bằng cách đổi trạng thái thành 'Ngừng bán'"
        });
      }
      
      res.status(500).json({ message: error.message });
    }
  }

  // Lấy danh sách sản phẩm (admin)
  async getAllProductsAdmin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { page = 1, limit = 10, search = "", status = null } = req.query;
      const result = await productService.getAllProductsAdmin(
        parseInt(page),
        parseInt(limit),
        search,
        status !== null ? parseInt(status) : null
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }


  

  // Cập nhật trạng thái sản phẩm (admin)
  async updateProductStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId } = req.params;
      const { TrangThai } = req.body; // Sửa từ 'status' thành 'TrangThai' để khớp với frontend
      const result = await productService.updateProductStatus(
        parseInt(productId),
        TrangThai
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Kiểm tra tồn kho (public)
  async checkStock(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId } = req.params;
      const { quantity } = req.body;
      const result = await productService.checkStockBeforeOrder(
        parseInt(productId),
        parseInt(quantity)
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Lấy thông tin biến thể sản phẩm (admin)
  async getProductVariants(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId } = req.params;
      const variants = await productService.getProductVariants(
        parseInt(productId)
      );
      res.json(variants);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // Lấy thông tin tồn kho chi tiết (admin)
  async getProductStockInfo(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { productId } = req.params;
      const stockInfo = await productService.getProductStockInfo(
        parseInt(productId)
      );
      res.json(stockInfo);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  ///////////////////////// Colors and Sizes API endpoints ////////////////////////////

  // Lấy danh sách màu sắc
  async getAllColors(req, res) {
    try {
      const colors = await productService.getAllColors();
      res.json(colors);
    } catch (error) {
      console.error("Error getting colors:", error);
      res.status(500).json({ message: error.message });
    }
  }

  // Lấy danh sách kích cỡ
  async getAllSizes(req, res) {
    try {
      const sizes = await productService.getAllSizes();
      res.json(sizes);
    } catch (error) {
      console.error("Error getting sizes:", error);
      res.status(500).json({ message: error.message });
    }
  }

  // Tạo màu sắc mới (admin)
  async createColor(req, res) {
    try {
      const { Ten, MaMau } = req.body;
      
      if (!Ten || !MaMau) {
        return res.status(400).json({ 
          message: "Tên màu và mã màu là bắt buộc" 
        });
      }

      const result = await productService.createColor({ Ten, MaMau });
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating color:", error);
      res.status(500).json({ message: error.message });
    }
  }

  // Tạo kích cỡ mới (admin)
  async createSize(req, res) {
    try {
      const { Ten } = req.body;
      
      if (!Ten) {
        return res.status(400).json({ 
          message: "Tên kích cỡ là bắt buộc" 
        });
      }

      const result = await productService.createSize({ Ten });
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating size:", error);
      res.status(500).json({ message: error.message });
    }
  }

  // Cập nhật màu sắc (admin)
  async updateColor(req, res) {
    try {
      const { id } = req.params;
      const { Ten, MaMau } = req.body;
      
      if (!Ten || !MaMau) {
        return res.status(400).json({ 
          message: "Tên màu và mã màu là bắt buộc" 
        });
      }

      const result = await productService.updateColor(id, { Ten, MaMau });
      res.json(result);
    } catch (error) {
      console.error("Error updating color:", error);
      res.status(500).json({ message: error.message });
    }
  }


  async getColorById(req, res) {
    try { 
      const { id } = req.params;
      const color = await productService.getColorById(id);  
      if (!color) {
        return res.status(404).json({ message: "Màu sắc không tồn tại" });
      }
      res.json(color);
    } catch (error) { 
      console.error("Error getting color by ID:", error);
      res.status(500).json({ message: error.message });
    }
  }

  // Cập nhật kích cỡ (admin)
  async updateSize(req, res) {
    try {
      const { id } = req.params;
      const { Ten } = req.body;
      
      if (!Ten) {
        return res.status(400).json({ 
          message: "Tên kích cỡ là bắt buộc" 
        });
      }

      const result = await productService.updateSize(id, { Ten });
      res.json(result);
    } catch (error) {
      console.error("Error updating size:", error);
      res.status(500).json({ message: error.message });
    }
  }

  // Xóa màu sắc (admin)
  async deleteColor(req, res) {
    try {
      const { id } = req.params;
      const result = await productService.deleteColor(id);
      res.json(result);
    } catch (error) {
      console.error("Error deleting color:", error);
      if (error.message.includes("đang được sử dụng")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  }

  // Xóa kích cỡ (admin)
  async deleteSize(req, res) {
    try {
      const { id } = req.params;
      const result = await productService.deleteSize(id);
      res.json(result);
    } catch (error) {
      console.error("Error deleting size:", error);
      if (error.message.includes("đang được sử dụng")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new ProductController();
