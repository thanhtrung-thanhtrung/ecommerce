const { ShippingMethod, Order, sequelize } = require("../models");
const { Op } = require("sequelize");

class ShippingService {
  // Lấy danh sách phương thức vận chuyển với phân trang và tìm kiếm
  async getShippingMethods(page = 1, limit = 10, search = "", status = null) {
    try {
      const offset = (page - 1) * limit;
      const whereConditions = {};

      // Thêm điều kiện tìm kiếm
      if (search) {
        whereConditions[Op.or] = [
          { Ten: { [Op.like]: `%${search}%` } },
          { MoTa: { [Op.like]: `%${search}%` } },
        ];
      }

      // Thêm điều kiện trạng thái
      if (status !== null) {
        whereConditions.TrangThai = status;
      }

      const { count, rows: shippingMethods } =
        await ShippingMethod.findAndCountAll({
          where: whereConditions,
          order: [["id", "DESC"]],
          limit,
          offset,
        });

      const totalPages = Math.ceil(count / limit);

      return {
        data: shippingMethods.map((s) => s.toJSON()),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      throw new Error(
        "Có lỗi khi lấy danh sách phương thức vận chuyển: " + error.message
      );
    }
  }

  // Lấy tất cả phương thức vận chuyển đang hoạt động (cho dropdown)
  async getAllActiveShippingMethods() {
    try {
      const shippingMethods = await ShippingMethod.findAll({
        where: { TrangThai: 1 },
        order: [["id", "DESC"]],
      });

      return shippingMethods.map((s) => s.toJSON());
    } catch (error) {
      throw new Error(
        "Có lỗi khi lấy phương thức vận chuyển: " + error.message
      );
    }
  }

  async getShippingMethodById(id) {
    try {
      const shippingMethod = await ShippingMethod.findByPk(id);

      if (!shippingMethod) {
        throw new Error("Phương thức vận chuyển không tồn tại");
      }

      return shippingMethod.toJSON();
    } catch (error) {
      throw new Error(
        "Có lỗi khi lấy phương thức vận chuyển: " + error.message
      );
    }
  }

  // Tạo mới phương thức vận chuyển
  async createShippingMethod(shippingData) {
    try {
      const {
        Ten,
        MoTa,
        PhiVanChuyen,
        ThoiGianDuKien,
        TrangThai = 1,
      } = shippingData;

      // Kiểm tra tên đã tồn tại
      const existing = await ShippingMethod.findOne({
        where: {
          Ten,
          TrangThai: 1,
        },
      });

      if (existing) {
        throw new Error("Tên phương thức vận chuyển đã tồn tại");
      }

      const result = await ShippingMethod.create({
        Ten,
        MoTa: MoTa || null,
        PhiVanChuyen,
        ThoiGianDuKien: ThoiGianDuKien || null,
        TrangThai,
      });

      return result.toJSON();
    } catch (error) {
      throw new Error(
        "Có lỗi khi tạo phương thức vận chuyển: " + error.message
      );
    }
  }

  // Cập nhật phương thức vận chuyển
  async updateShippingMethod(id, updateData) {
    try {
      // Kiểm tra phương thức vận chuyển có tồn tại
      const shippingMethod = await ShippingMethod.findByPk(id);

      if (!shippingMethod) {
        throw new Error("Phương thức vận chuyển không tồn tại");
      }

      // Kiểm tra tên trùng lặp (nếu có cập nhật tên)
      if (updateData.Ten) {
        const existing = await ShippingMethod.findOne({
          where: {
            Ten: updateData.Ten,
            id: { [Op.ne]: id },
            TrangThai: 1,
          },
        });

        if (existing) {
          throw new Error("Tên phương thức vận chuyển đã tồn tại");
        }
      }

      // Lọc ra các field có giá trị undefined
      const filteredUpdateData = Object.keys(updateData).reduce((acc, key) => {
        if (updateData[key] !== undefined) {
          acc[key] = updateData[key];
        }
        return acc;
      }, {});

      if (Object.keys(filteredUpdateData).length === 0) {
        throw new Error("Không có dữ liệu để cập nhật");
      }

      await shippingMethod.update(filteredUpdateData);

      const updatedShippingMethod = await this.getShippingMethodById(id);
      return updatedShippingMethod;
    } catch (error) {
      throw new Error(
        "Có lỗi khi cập nhật phương thức vận chuyển: " + error.message
      );
    }
  }

  // Xóa cứng phương thức vận chuyển (hard delete)
  async hardDeleteShippingMethod(id) {
    try {
      // Kiểm tra phương thức vận chuyển có tồn tại (bao gồm cả đã bị xóa mềm)
      const shippingMethod = await ShippingMethod.findByPk(id);

      if (!shippingMethod) {
        throw new Error("Phương thức vận chuyển không tồn tại");
      }

      // Kiểm tra có đơn hàng nào sử dụng không (bao gồm cả đơn hàng đã hoàn thành)
      const orderCount = await Order.count({
        where: { id_VanChuyen: id },
      });

      if (orderCount > 0) {
        throw new Error(
          "Không thể xóa vĩnh viễn phương thức vận chuyển đã được sử dụng trong đơn hàng. Chỉ có thể vô hiệu hóa."
        );
      }

      // Xóa vĩnh viễn khỏi database
      await shippingMethod.destroy();

      return {
        message: "Xóa vĩnh viễn phương thức vận chuyển thành công",
        deletedMethod: shippingMethod.toJSON(),
      };
    } catch (error) {
      throw new Error(
        "Có lỗi khi xóa vĩnh viễn phương thức vận chuyển: " + error.message
      );
    }
  }

  // Tính phí vận chuyển dựa trên phương thức vận chuyển từ database
  async calculateShippingFee(shippingMethodId, orderValue, address = null) {
    try {
      const shippingMethod = await ShippingMethod.findOne({
        where: {
          id: shippingMethodId,
          TrangThai: 1,
        },
      });

      if (!shippingMethod) {
        throw new Error(
          "Phương thức vận chuyển không tồn tại hoặc đã bị vô hiệu hóa"
        );
      }

      const shippingFee = parseFloat(shippingMethod.PhiVanChuyen) || 0;

      return {
        fee: shippingFee,
        originalFee: parseFloat(shippingMethod.PhiVanChuyen) || 0,
        isFree: false,
        method: {
          id: shippingMethod.id,
          name: shippingMethod.Ten,
          description: shippingMethod.MoTa,
          estimatedTime: shippingMethod.ThoiGianDuKien,
        },
      };
    } catch (error) {
      throw new Error("Có lỗi khi tính phí vận chuyển: " + error.message);
    }
  }

  // Method để lấy thông tin vận chuyển với phí tính toán từ database
  async getShippingOptionsWithFees(orderValue, address = null) {
    try {
      // Lấy tất cả phương thức vận chuyển đang hoạt động
      const activeShippingMethods = await ShippingMethod.findAll({
        where: { TrangThai: 1 },
        order: [["id", "ASC"]],
      });

      if (activeShippingMethods.length === 0) {
        throw new Error("Không có phương thức vận chuyển nào khả dụng");
      }

      const options = activeShippingMethods.map((method) => {
        const fee = parseFloat(method.PhiVanChuyen) || 0;

        return {
          id: method.id,
          name: method.Ten,
          description: method.MoTa || `Giao hàng ${method.Ten}`,
          estimatedTime: method.ThoiGianDuKien || "2-4 ngày",
          originalFee: parseFloat(method.PhiVanChuyen) || 0,
          fee: fee,
          isFree: false,
        };
      });

      return options;
    } catch (error) {
      throw new Error("Có lỗi khi lấy tùy chọn vận chuyển: " + error.message);
    }
  }
}

module.exports = new ShippingService();
