import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import wishlistAPI from "../../services/wishlistAPI"
import { toast } from "react-toastify"

// Async thunks
export const fetchWishlist = createAsyncThunk("wishlist/fetchWishlist", async (_, { rejectWithValue }) => {
  try {
    const response = await wishlistAPI.getWishlist()
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Lỗi tải danh sách yêu thích")
  }
})

export const addToWishlist = createAsyncThunk("wishlist/addToWishlist", async (productId, { rejectWithValue }) => {
  try {
    const response = await wishlistAPI.addToWishlist(productId)
    toast.success("Đã thêm vào danh sách yêu thích!")
    return response.data
  } catch (error) {
    toast.error(error.response?.data?.message || "Lỗi thêm vào danh sách yêu thích")
    return rejectWithValue(error.response?.data?.message || "Lỗi thêm vào danh sách yêu thích")
  }
})

export const removeFromWishlist = createAsyncThunk(
  "wishlist/removeFromWishlist",
  async (productId, { rejectWithValue }) => {
    try {
      await wishlistAPI.removeFromWishlist(productId)
      toast.success("Đã xóa khỏi danh sách yêu thích!")
      return productId
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi xóa khỏi danh sách yêu thích")
      return rejectWithValue(error.response?.data?.message || "Lỗi xóa khỏi danh sách yêu thích")
    }
  },
)

export const clearWishlist = createAsyncThunk("wishlist/clearWishlist", async (_, { rejectWithValue }) => {
  try {
    await wishlistAPI.clearWishlist()
    toast.success("Đã xóa toàn bộ danh sách yêu thích!")
    return []
  } catch (error) {
    toast.error(error.response?.data?.message || "Lỗi xóa danh sách yêu thích")
    return rejectWithValue(error.response?.data?.message || "Lỗi xóa danh sách yêu thích")
  }
})

const initialState = {
  items: [],
  totalItems: 0,
  isLoading: false,
  error: null,
}

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload.items || action.payload
        state.totalItems = action.payload.totalItems || action.payload.length
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Add to Wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.isLoading = false
        // Add product to wishlist if not already there
        const product = action.payload
        const exists = state.items.find((item) => item.id === product.id)
        if (!exists) {
          state.items.push(product)
          state.totalItems += 1
        }
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Remove from Wishlist
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        const productId = action.payload
        state.items = state.items.filter((item) => item.id !== productId)
        state.totalItems = state.items.length
      })
      // Clear Wishlist
      .addCase(clearWishlist.fulfilled, (state) => {
        state.items = []
        state.totalItems = 0
      })
  },
})

export const { clearError } = wishlistSlice.actions
export default wishlistSlice.reducer
