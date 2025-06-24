const db = require("../config/database");

class ShippingService {
  // Lấy danh sách phương thức vận chuyển với phân trang và tìm kiếm
  async   getShippingMethods(page = 1, limit = 10, search = "", status = null) {
    try {
      const offset = (page - 1) * limit;
      let query = "SELECT * FROM hinhthucvanchuyen WHERE 1=1";
      let countQuery =
        "SELECT COUNT(*) as total FROM hinhthucvanchuyen WHERE 1=1";
      const params = [];
      const countParams = [];

      // Thêm điều kiện tìm kiếm
      if (search) {
        query += " AND (Ten LIKE ? OR MoTa LIKE ?)";
        countQuery += " AND (Ten LIKE ? OR MoTa LIKE ?)";
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam);
        countParams.push(searchParam, searchParam);
      }

      // Thêm điều kiện trạng thái
      if (status !== null) {
        query += " AND TrangThai = ?";
        countQuery += " AND TrangThai = ?";
        params.push(status);
        countParams.push(status);
      }

      // Thêm sắp xếp và phân trang
      query += " ORDER BY id DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [shippingMethods] = await db.execute(query, params);
      const [countResult] = await db.execute(countQuery, countParams);

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      return {
        data: shippingMethods,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
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
      const [shippingMethods] = await db.execute(
        "SELECT * FROM hinhthucvanchuyen WHERE TrangThai = 1 ORDER BY id DESC"
      );
      return shippingMethods;
    } catch (error) {
      throw new Error(
        "Có lỗi khi lấy phương thức vận chuyển: " + error.message
      );
    }
  }

  async getShippingMethodById(id) {
    try {
      const [shippingMethod] = await db.execute(
        "SELECT * FROM hinhthucvanchuyen WHERE id = ?",
        [id]
      );

      if (shippingMethod.length === 0) {
        throw new Error("Phương thức vận chuyển không tồn tại");
      }

      return shippingMethod[0];
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
      const [existing] = await db.execute(
        "SELECT id FROM hinhthucvanchuyen WHERE Ten = ? AND TrangThai = 1",
        [Ten]
      );

      if (existing.length > 0) {
        throw new Error("Tên phương thức vận chuyển đã tồn tại");
      }

      const [result] = await db.execute(
        `INSERT INTO hinhthucvanchuyen (Ten, MoTa, PhiVanChuyen, ThoiGianDuKien, TrangThai) 
         VALUES (?, ?, ?, ?, ?)`,
        [Ten, MoTa || null, PhiVanChuyen, ThoiGianDuKien || null, TrangThai]
      );

      const newShippingMethod = await this.getShippingMethodById(
        result.insertId
      );
      return newShippingMethod;
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
      await this.getShippingMethodById(id);

      // Kiểm tra tên trùng lặp (nếu có cập nhật tên)
      if (updateData.Ten) {
        const [existing] = await db.execute(
          "SELECT id FROM hinhthucvanchuyen WHERE Ten = ? AND id != ? AND TrangThai = 1",
          [updateData.Ten, id]
        );

        if (existing.length > 0) {
          throw new Error("Tên phương thức vận chuyển đã tồn tại");
        }
      }

      // Tạo câu query update động
      const updateFields = [];
      const values = [];

      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });

      if (updateFields.length === 0) {
        throw new Error("Không có dữ liệu để cập nhật");
      }

      values.push(id);

      await db.execute(
        `UPDATE hinhthucvanchuyen SET ${updateFields.join(", ")} WHERE id = ?`,
        values
      );

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
      const [shippingMethod] = await db.execute(
        "SELECT * FROM hinhthucvanchuyen WHERE id = ?",
        [id]
      );

      if (shippingMethod.length === 0) {
        throw new Error("Phương thức vận chuyển không tồn tại");
      }

      const method = shippingMethod[0];

      // Kiểm tra có đơn hàng nào sử dụng không (bao gồm cả đơn hàng đã hoàn thành)
      const [orders] = await db.execute(
        "SELECT COUNT(*) as count FROM donhang WHERE id_VanChuyen = ?",
        [id]
      );

      if (orders[0].count > 0) {
        throw new Error(
          "Không thể xóa vĩnh viễn phương thức vận chuyển đã được sử dụng trong đơn hàng. Chỉ có thể vô hiệu hóa."
        );
      }

      // Xóa vĩnh viễn khỏi database
      await db.execute("DELETE FROM hinhthucvanchuyen WHERE id = ?", [id]);

      return {
        message: "Xóa vĩnh viễn phương thức vận chuyển thành công",
        deletedMethod: method,
      };
    } catch (error) {
      throw new Error(
        "Có lỗi khi xóa vĩnh viễn phương thức vận chuyển: " + error.message
      );
    }
  }

  async calculateShippingFee(shippingMethodId, orderValue, address = null) {
    try {
      // Miễn phí vận chuyển nếu đơn hàng trên 2 triệu
      if (orderValue >= 2000000) {
        return 0;
      }

      // Nếu có địa chỉ, tính phí theo khu vực
      if (address) {
        const isHCM = this.isHCMAddress(address);
        return isHCM ? 30000 : 50000;
      }

      // Fallback về logic cũ nếu không có địa chỉ
      const shippingMethod = await this.getShippingMethodById(shippingMethodId);
      return shippingMethod.PhiVanChuyen || 50000; // Default 50k nếu không xác định được
    } catch (error) {
      throw new Error("Có lỗi khi tính phí vận chuyển: " + error.message);
    }
  }

  // Kiểm tra địa chỉ có phải TP.HCM không
  isHCMAddress(address) {
    const hcmKeywords = [
      "hồ chí minh",
      "ho chi minh",
      "hcm",
      "tp.hcm",
      "tphcm",
      "sài gòn",
      "saigon",
      "sài gòn",
      "thành phố hồ chí minh",
    ];

    const addressLower = address.toLowerCase();
    return hcmKeywords.some((keyword) => addressLower.includes(keyword));
  }

  // Method để lấy thông tin vận chuyển với phí tính toán
  async getShippingOptionsWithFees(orderValue, address = null) {
    try {
      const baseOptions = [
        {
          id: "standard_hcm",
          name: "Giao hàng tiêu chuẩn - TP.HCM",
          description: "Giao hàng trong 1-2 ngày (TP.HCM)",
          estimatedDays: "1-2 ngày",
          isHCM: true,
        },
        {
          id: "standard_other",
          name: "Giao hàng tiêu chuẩn - Ngoại thành",
          description: "Giao hàng trong 2-4 ngày (Ngoại thành)",
          estimatedDays: "2-4 ngày",
          isHCM: false,
        },
      ];

      const options = baseOptions.map((option) => {
        let fee = option.isHCM ? 30000 : 50000;

        // Miễn phí nếu đơn hàng trên 2 triệu
        if (orderValue >= 2000000) {
          fee = 0;
        }

        return {
          ...option,
          fee,
          freeShippingThreshold: 2000000,
        };
      });

      // Nếu có địa chỉ, chỉ trả về option phù hợp
      if (address) {
        const isHCM = this.isHCMAddress(address);
        return options.filter((option) => option.isHCM === isHCM);
      }

      return options;
    } catch (error) {
      throw new Error("Có lỗi khi lấy tùy chọn vận chuyển: " + error.message);
    }
  }
}

module.exports = new ShippingService();
