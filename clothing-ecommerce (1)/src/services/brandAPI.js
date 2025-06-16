import api from "./api";

const brandAPI = {
  // Lấy danh sách thương hiệu
  getBrands: () => {
    return api.get("/brands");
  },

  // Lấy chi tiết thương hiệu
  getBrandById: (id) => {
    return api.get(`/brands/${id}`);
  },

  // Tạo thương hiệu mới
  createBrand: (brandData) => {
    return api.post("/brands", brandData);
  },

  // Cập nhật thương hiệu
  updateBrand: (id, brandData) => {
    return api.put(`/brands/${id}`, brandData);
  },

  // Xóa thương hiệu
  deleteBrand: (id) => {
    return api.delete(`/brands/${id}`);
  },
};

export default brandAPI;
