import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useShop } from "../../contexts/ShopContext"
import OrderCard from "../../components/Order/OrderCard"
import OrderFilters from "../../components/Order/OrderFilters"
import Pagination from "../../components/Common/Pagination"
import LoadingSpinner from "../../components/Common/LoadingSpinner"

const OrdersPage = () => {
  const {
    orders,
    loading,
    totalOrders,
    currentPage,
    totalPages,
    orderStatuses,
    fetchUserOrders,
    cancelOrder,
    setCurrentPage,
  } = useShop()

  const [statusFilter, setStatusFilter] = useState("")

  useEffect(() => {
    fetchUserOrders({ page: currentPage, status: statusFilter })
  }, [fetchUserOrders, currentPage, statusFilter])

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handleCancelOrder = (orderId) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
      cancelOrder(orderId)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Đơn hàng của tôi ({totalOrders})
        </h1>
      </div>

      <OrderFilters
        statuses={orderStatuses}
        currentStatus={statusFilter}
        onStatusChange={handleStatusFilter}
      />

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
            {/* Package icon */}
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Chưa có đơn hàng nào
          </h3>
          <p className="text-gray-500 mb-8">
            Hãy mua sắm ngay để tạo đơn hàng đầu tiên của bạn
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onCancel={handleCancelOrder}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default OrdersPage
