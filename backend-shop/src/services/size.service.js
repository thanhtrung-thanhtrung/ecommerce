const { Size, ProductVariant } = require("../models/sequelize");

class SizeService {
  // Lấy tất cả sizes
  async getAllSizes() {
    try {
      const sizes = await Size.findAll({
        order: [["Ten", "ASC"]],
      });
      return sizes;
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách sizes: ${error.message}`);
    }
  }

  // Lấy size theo ID
  async getSizeById(id) {
    try {
      const size = await Size.findByPk(id);
      if (!size) {
        throw new Error("Size không tồn tại");
      }
      return size;
    } catch (error) {
      throw new Error(`Lỗi khi lấy size: ${error.message}`);
    }
  }

  // Tạo size mới
  async createSize(sizeData) {
    try {
      // Kiểm tra tên size đã tồn tại
      const existingSize = await Size.findOne({
        where: { Ten: sizeData.Ten },
      });

      if (existingSize) {
        throw new Error("Tên size đã tồn tại");
      }

      const newSize = await Size.create(sizeData);
      return newSize;
    } catch (error) {
      throw new Error(`Lỗi khi tạo size: ${error.message}`);
    }
  }

  // Cập nhật size
  async updateSize(id, sizeData) {
    try {
      const size = await Size.findByPk(id);
      if (!size) {
        throw new Error("Size không tồn tại");
      }

      // Kiểm tra tên size trùng lặp (ngoại trừ chính nó)
      if (sizeData.Ten) {
        const existingSize = await Size.findOne({
          where: {
            Ten: sizeData.Ten,
            id: { [require("sequelize").Op.ne]: id },
          },
        });

        if (existingSize) {
          throw new Error("Tên size đã tồn tại");
        }
      }

      await size.update(sizeData);
      return await Size.findByPk(id);
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật size: ${error.message}`);
    }
  }

  // Xóa size
  async deleteSize(id) {
    try {
      const size = await Size.findByPk(id);
      if (!size) {
        throw new Error("Size không tồn tại");
      }

      // Kiểm tra xem size có đang được sử dụng không
      const productVariantCount = await ProductVariant.count({
        where: { SizeId: id },
      });

      if (productVariantCount > 0) {
        throw new Error("Không thể xóa size đang được sử dụng bởi sản phẩm");
      }

      await size.destroy();
      return { message: "Xóa size thành công" };
    } catch (error) {
      throw new Error(`Lỗi khi xóa size: ${error.message}`);
    }
  }

  // Lấy sizes có phân trang
  async getSizesWithPagination(page = 1, limit = 10, search = "") {
    try {
      const offset = (page - 1) * limit;
      const whereClause = search
        ? {
            Ten: { [require("sequelize").Op.like]: `%${search}%` },
          }
        : {};

      const { count, rows } = await Size.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [["Ten", "ASC"]],
      });

      return {
        sizes: rows,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách sizes: ${error.message}`);
    }
  }

  // Lấy sizes được sử dụng nhiều nhất
  async getPopularSizes() {
    try {
      const sizes = await Size.findAll({
        include: [
          {
            model: ProductVariant,
            attributes: [],
            required: false,
          },
        ],
        attributes: [
          "id",
          "Ten",
          [
            require("sequelize").fn(
              "COUNT",
              require("sequelize").col("ProductVariants.id")
            ),
            "usage_count",
          ],
        ],
        group: ["Size.id"],
        order: [[require("sequelize").literal("usage_count"), "DESC"]],
        limit: 10,
      });

      return sizes;
    } catch (error) {
      throw new Error(`Lỗi khi lấy sizes phổ biến: ${error.message}`);
    }
  }
}

module.exports = new SizeService();
