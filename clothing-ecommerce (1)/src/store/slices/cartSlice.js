  import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
  import cartAPI from "../../services/cartAPI";
  import { toast } from "react-toastify";

  // Async thunks
  export const fetchCart = createAsyncThunk(
    "cart/fetchCart",
    async (_, { rejectWithValue }) => {
      try {
        const response = await cartAPI.getCart();
        return response.data;
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message || "Lỗi tải giỏ hàng"
        );
      }
    }
  );

  export const addToCart = createAsyncThunk(
    "cart/addToCart",
    async (item, { rejectWithValue }) => {
      try {
        const response = await cartAPI.addToCart({
          id_ChiTietSanPham: item.id_ChiTietSanPham,
          soLuong: item.soLuong || 1,
        });
        toast.success("Đã thêm sản phẩm vào giỏ hàng!");
        return response.data;
      } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi thêm vào giỏ hàng");
        return rejectWithValue(
          error.response?.data?.message || "Lỗi thêm vào giỏ hàng"
        );
      }
    }
  );

  export const updateCartItem = createAsyncThunk(
    "cart/updateCartItem",
    async ({ id, quantity }, { rejectWithValue }) => {
      try {
        const response = await cartAPI.updateCartItem(id, { soLuong: quantity });
        return response.data;
      } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi cập nhật giỏ hàng");
        return rejectWithValue(
          error.response?.data?.message || "Lỗi cập nhật giỏ hàng"
        );
      }
    }
  );

  export const removeFromCart = createAsyncThunk(
    "cart/removeFromCart",
    async (id, { rejectWithValue }) => {
      try {
        const response = await cartAPI.removeFromCart(id);
        toast.success("Đã xóa sản phẩm khỏi giỏ hàng!");
        return response.data;
      } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi xóa khỏi giỏ hàng");
        return rejectWithValue(
          error.response?.data?.message || "Lỗi xóa khỏi giỏ hàng"
        );
      }
    }
  );

  export const clearCart = createAsyncThunk(
    "cart/clearCart",
    async (_, { rejectWithValue }) => {
      try {
        const response = await cartAPI.clearCart();
        toast.success("Đã xóa toàn bộ giỏ hàng!");
        return response.data;
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message || "Lỗi xóa giỏ hàng"
        );
      }
    }
  );

  export const mergeCart = createAsyncThunk(
    "cart/mergeCart",
    async (_, { rejectWithValue }) => {
      try {
        const response = await cartAPI.mergeCart();
        return response.data;
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message || "Lỗi gộp giỏ hàng"
        );
      }
    }
  );

  const initialState = {
    items: [],
    totalItems: 0,
    totalAmount: 0,
    isLoading: false,
    error: null,
  };

  const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
      clearError: (state) => {
        state.error = null;
      },
      // Local cart management for guest users
      addToLocalCart: (state, action) => {
        const item = action.payload;
        const existingItem = state.items.find(
          (i) => i.id_ChiTietSanPham === item.id_ChiTietSanPham
        );

        if (existingItem) {
          existingItem.SoLuong += item.soLuong || 1;
        } else {
          state.items.push({
            ...item,
            SoLuong: item.soLuong || 1,
          });
        }

        state.totalItems = state.items.reduce(
          (total, item) => total + (parseInt(item.SoLuong) || 0),
          0
        );
        state.totalAmount = state.items.reduce(
          (total, item) =>
            total + parseFloat(item.Gia) * (parseInt(item.SoLuong) || 0),
          0
        );
      },
      updateLocalCartItem: (state, action) => {
        const { id, quantity } = action.payload;
        const item = state.items.find((i) => i.id === id);

        if (item) {
          item.SoLuong = quantity;
          state.totalItems = state.items.reduce(
            (total, item) => total + (parseInt(item.SoLuong) || 0),
            0
          );
          state.totalAmount = state.items.reduce(
            (total, item) =>
              total + parseFloat(item.Gia) * (parseInt(item.SoLuong) || 0),
            0
          );
        }
      },
      removeFromLocalCart: (state, action) => {
        const id = action.payload;
        state.items = state.items.filter((item) => item.id !== id);
        state.totalItems = state.items.reduce(
          (total, item) => total + (parseInt(item.SoLuong) || 0),
          0
        );
        state.totalAmount = state.items.reduce(
          (total, item) =>
            total + parseFloat(item.Gia) * (parseInt(item.SoLuong) || 0),
          0
        );
      },
      clearLocalCart: (state) => {
        state.items = [];
        state.totalItems = 0;
        state.totalAmount = 0;
      },
    },
    extraReducers: (builder) => {
      builder
        // Fetch Cart
        .addCase(fetchCart.pending, (state) => {
          state.isLoading = true;
          state.error = null;
        })
        .addCase(fetchCart.fulfilled, (state, action) => {
          state.isLoading = false;
          // Backend trả về mảng trực tiếp hoặc đối tượng có thuộc tính items
          if (Array.isArray(action.payload)) {
            state.items = action.payload;
          } else if (action.payload && action.payload.items) {
            state.items = action.payload.items;
          } else {
            state.items = [];
          }

          state.totalItems = state.items.reduce(
            (total, item) => total + (parseInt(item.SoLuong) || 0),
            0
          );
          state.totalAmount = state.items.reduce(
            (total, item) =>
              total + parseFloat(item.Gia) * (parseInt(item.SoLuong) || 0),
            0
          );
        })
        .addCase(fetchCart.rejected, (state, action) => {
          state.isLoading = false;
          state.error = action.payload;
        })
        // Add to Cart
        .addCase(addToCart.pending, (state) => {
          state.isLoading = true;
          state.error = null;
        })
        .addCase(addToCart.fulfilled, (state, action) => {
          state.isLoading = false;
          // Backend trả về toàn bộ giỏ hàng sau khi thêm
          if (Array.isArray(action.payload)) {
            state.items = action.payload;
          } else if (action.payload && action.payload.items) {
            state.items = action.payload.items;
          } else {
            state.items = [];
          }

          state.totalItems = state.items.reduce(
            (total, item) => total + (parseInt(item.SoLuong) || 0),
            0
          );
          state.totalAmount = state.items.reduce(
            (total, item) =>
              total + parseFloat(item.Gia) * (parseInt(item.SoLuong) || 0),
            0
          );
        })
        .addCase(addToCart.rejected, (state, action) => {
          state.isLoading = false;
          state.error = action.payload;
        })
        // Update Cart Item
        .addCase(updateCartItem.fulfilled, (state, action) => {
          // Backend trả về toàn bộ giỏ hàng sau khi cập nhật
          if (Array.isArray(action.payload)) {
            state.items = action.payload;
          } else if (action.payload && action.payload.items) {
            state.items = action.payload.items;
          } else {
            state.items = [];
          }

          state.totalItems = state.items.reduce(
            (total, item) => total + (parseInt(item.SoLuong) || 0),
            0
          );
          state.totalAmount = state.items.reduce(
            (total, item) =>
              total + parseFloat(item.Gia) * (parseInt(item.SoLuong) || 0),
            0
          );
        })
        // Remove from Cart
        .addCase(removeFromCart.fulfilled, (state, action) => {
          // Backend trả về toàn bộ giỏ hàng sau khi xóa
          if (Array.isArray(action.payload)) {
            state.items = action.payload;
          } else if (action.payload && action.payload.items) {
            state.items = action.payload.items;
          } else {
            state.items = [];
          }

          state.totalItems = state.items.reduce(
            (total, item) => total + (parseInt(item.SoLuong) || 0),
            0
          );
          state.totalAmount = state.items.reduce(
            (total, item) =>
              total + parseFloat(item.Gia) * (parseInt(item.SoLuong) || 0),
            0
          );
        })
        // Clear Cart
        .addCase(clearCart.fulfilled, (state) => {
          state.items = [];
          state.totalItems = 0;
          state.totalAmount = 0;
        })
        // Merge Cart
        .addCase(mergeCart.fulfilled, (state, action) => {
          if (Array.isArray(action.payload)) {
            state.items = action.payload;
          } else if (action.payload && action.payload.items) {
            state.items = action.payload.items;
          } else {
            state.items = [];
          }

          state.totalItems = state.items.reduce(
            (total, item) => total + (parseInt(item.SoLuong) || 0),
            0
          );
          state.totalAmount = state.items.reduce(
            (total, item) =>
              total + parseFloat(item.Gia) * (parseInt(item.SoLuong) || 0),
            0
          );
        });
    },
  });

  export const {
    clearError,
    addToLocalCart,
    updateLocalCartItem,
    removeFromLocalCart,
    clearLocalCart,
  } = cartSlice.actions;

  export default cartSlice.reducer;
