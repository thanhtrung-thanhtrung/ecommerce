const cloudinary = require("../config/cloudinary.config");

class CloudinaryUtil {
  // Upload một hình ảnh
  async uploadImage(file, folder) {
    try {
      // Kiểm tra xem file có phải là đối tượng Multer hay không
      let fileToUpload;
      if (file && file.path) {
        // Nếu là file từ Multer, sử dụng đường dẫn tạm thời
        fileToUpload = file.path;
      } else if (typeof file === "string") {
        // Nếu là đường dẫn file hoặc base64, sử dụng trực tiếp
        fileToUpload = file;
      } else {
        throw new Error("Định dạng file không hợp lệ");
      }

      const result = await cloudinary.uploader.upload(fileToUpload, {
        folder: folder,
        resource_type: "auto",
        // Tối ưu hóa hình ảnh
        transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
      });

      return {
        url: result.secure_url,
        public_id: result.public_id,
      };
    } catch (error) {
      console.error("Lỗi khi upload hình ảnh:", error);
      throw new Error("Không thể upload hình ảnh: " + error.message);
    }
  }

  // Upload nhiều hình ảnh
  async uploadMultipleImages(files, folder) {
    try {
      if (!Array.isArray(files)) {
        throw new Error("Danh sách file không hợp lệ");
      }

      const uploadPromises = files.map((file) =>
        this.uploadImage(file, folder)
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error("Lỗi khi upload nhiều hình ảnh:", error);
      throw new Error("Không thể upload nhiều hình ảnh: " + error.message);
    }
  }

  // Xóa một hình ảnh
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error("Lỗi khi xóa hình ảnh:", error);
      throw new Error("Không thể xóa hình ảnh: " + error.message);
    }
  }

  // Xóa nhiều hình ảnh
  async deleteMultipleImages(publicIds) {
    try {
      const deletePromises = publicIds.map((publicId) =>
        this.deleteImage(publicId)
      );
      return await Promise.all(deletePromises);
    } catch (error) {
      console.error("Lỗi khi xóa nhiều hình ảnh:", error);
      throw new Error("Không thể xóa nhiều hình ảnh: " + error.message);
    }
  }

  // Tạo URL hình ảnh với kích thước tùy chỉnh
  getImageUrl(publicId, options = {}) {
    try {
      const defaultOptions = {
        width: 500,
        height: 500,
        crop: "fill",
        quality: "auto",
        fetch_format: "auto",
      };

      const finalOptions = { ...defaultOptions, ...options };
      return cloudinary.url(publicId, finalOptions);
    } catch (error) {
      console.error("Lỗi khi tạo URL hình ảnh:", error);
      throw new Error("Không thể tạo URL hình ảnh: " + error.message);
    }
  }

  // Tạo thumbnail cho hình ảnh
  getThumbnailUrl(publicId, width = 200, height = 200) {
    return this.getImageUrl(publicId, {
      width,
      height,
      crop: "fill",
      quality: "auto",
      fetch_format: "auto",
    });
  }

  // Tạo hình ảnh preview cho sản phẩm
  getProductPreviewUrl(publicId) {
    return this.getImageUrl(publicId, {
      width: 800,
      height: 800,
      crop: "fill",
      quality: "auto",
      fetch_format: "auto",
    });
  }

  // Tạo hình ảnh chi tiết cho sản phẩm
  getProductDetailUrl(publicId) {
    return this.getImageUrl(publicId, {
      width: 1200,
      height: 1200,
      crop: "fill",
      quality: "auto",
      fetch_format: "auto",
    });
  }
}

module.exports = new CloudinaryUtil();
