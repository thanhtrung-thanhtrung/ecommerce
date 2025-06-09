
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { fetchUserOrders, cancelOrder, setCurrentPage } from "../../store/slices/orderSlice"
import OrderCard from "../../components/Order/OrderCard"
import OrderFilters from "../../components/Order/OrderFilters"
import Pagination from "../../components/Common/Pagination"

const OrdersPage = () => {
  const dispatch = useDispatch()
  const { orders, isLoading, totalOrders, currentPage, totalPages, orderStatuses } = useSelector(
    (state) => state.orders,
  )

  const [statusFilter, setStatusFilter] = useState("")

  useEffect(() => {
    dispatch(fetchUserOrders({ page: currentPage, status: statusFilter }))
  }, [dispatch, currentPage, statusFilter])

  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page))
  }

  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    dispatch(setCurrentPage(1))
  }

  const handleCancelOrder = (orderId, reason) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
      dispatch(cancelOrder({ id: orderId, reason }))
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Đơn hàng của tôi</h1>
        <span className="text-gray-600">{totalOrders > 0 ? `${totalOrders} đơn hàng` : "Chưa có đơn hàng nào"}</span>
      </div>

      {/* Order Filters */}
      <div className="mb-6">
        <OrderFilters orderStatuses={orderStatuses} selectedStatus={statusFilter} onStatusChange={handleStatusFilter} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="spinner"></div>
        </div>
      ) : orders.length > 0 ? (
        <>
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} onCancel={handleCancelOrder} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-6">📦</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Chưa có đơn hàng nào</h3>
          <p className="text-gray-600 mb-8">Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!</p>
          <Link to="/products" className="btn-primary">
            Mua sắm ngay
          </Link>
        </div>
      )}
    </div>
  )
}

export default OrdersPage
