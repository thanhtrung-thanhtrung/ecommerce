import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import orderAPI from "../../services/orderAPI"
import { toast } from "react-toastify"

// Async thunks
export const createOrder = createAsyncThunk("orders/createOrder", async (orderData, { rejectWithValue }) => {
  try {
    const response = await orderAPI.createOrder(orderData)
    toast.success("Đặt hàng thành công!")
    return response.data
  } catch (error) {
    toast.error(error.response?.data?.message || "Lỗi đặt hàng")
    return rejectWithValue(error.response?.data?.message || "Lỗi đặt hàng")
  }
})

export const fetchUserOrders = createAsyncThunk("orders/fetchUserOrders", async (params = {}, { rejectWithValue }) => {
  try {
    const response = await orderAPI.getUserOrders(params)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Lỗi tải đơn hàng")
  }
})

export const fetchOrderById = createAsyncThunk("orders/fetchOrderById", async (id, { rejectWithValue }) => {
  try {
    const response = await orderAPI.getOrderById(id)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Lỗi tải chi tiết đơn hàng")
  }
})

export const cancelOrder = createAsyncThunk("orders/cancelOrder", async ({ id, reason }, { rejectWithValue }) => {
  try {
    const response = await orderAPI.cancelOrder(id, reason)
    toast.success("Hủy đơn hàng thành công!")
    return response.data
  } catch (error) {
    toast.error(error.response?.data?.message || "Lỗi hủy đơn hàng")
    return rejectWithValue(error.response?.data?.message || "Lỗi hủy đơn hàng")
  }
})

const initialState = {
  orders: [],
  currentOrder: null,
  totalOrders: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  orderStatuses: {
    1: "Chờ xác nhận",
    2: "Đã xác nhận",
    3: "Đang giao",
    4: "Đã giao",
    5: "Đã hủy",
  },
}

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null
    },
    clearError: (state) => {
      state.error = null
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentOrder = action.payload
        // Add to orders list if it exists
        if (state.orders.length > 0) {
          state.orders.unshift(action.payload)
        }
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Fetch User Orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.isLoading = false
        state.orders = action.payload.orders || action.payload
        state.totalOrders = action.payload.total || action.payload.length
        state.totalPages = action.payload.totalPages || 1
        state.currentPage = action.payload.currentPage || 1
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Fetch Order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentOrder = action.payload
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Cancel Order
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const cancelledOrder = action.payload
        // Update order in list
        const index = state.orders.findIndex((order) => order.id === cancelledOrder.id)
        if (index !== -1) {
          state.orders[index] = cancelledOrder
        }
        // Update current order if it's the same
        if (state.currentOrder && state.currentOrder.id === cancelledOrder.id) {
          state.currentOrder = cancelledOrder
        }
      })
  },
})

export const { clearCurrentOrder, clearError, setCurrentPage } = orderSlice.actions
export default orderSlice.reducer
