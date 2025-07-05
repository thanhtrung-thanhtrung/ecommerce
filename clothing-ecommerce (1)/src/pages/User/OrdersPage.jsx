import React, { useEffect } from "react"
import { useShop } from "../../contexts/ShopContext";
import { toast } from "react-toastify";

const statusMap = {
  1: "Chờ xác nhận",
  2: "Đã xác nhận",
  3: "Đang giao",
  4: "Đã giao",
  5: "Đã hủy",
}

const OrdersPage = () => {
  const { orders, loading, error, fetchUserOrders, cancelOrder } = useShop()

  useEffect(() => {
    fetchUserOrders()
  }, [fetchUserOrders])

  // Handle cancel order - chỉ cho phép hủy khi trạng thái = 1 (Chờ xác nhận)
  const handleCancelOrder = async (orderId, orderCode) => {
    if (window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${orderCode}?`)) {
      try {
        await cancelOrder(orderId, "Khách hàng yêu cầu hủy đơn hàng");
        toast.success("Hủy đơn hàng thành công!");
        // Tải lại danh sách đơn hàng
        fetchUserOrders();
      } catch (error) {
        console.error("Error cancelling order:", error);
        toast.error("Lỗi khi hủy đơn hàng: " + (error.message || "Không xác định"));
      }
    }
  };


  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>
        Đơn hàng của tôi
      </h2>
      {loading && <p>Đang tải...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && orders.length === 0 && <p>Không có đơn hàng nào.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {orders.map((order) => (
          <div key={order.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <b>Mã đơn:</b> {order.MaDonHang || order.id}
              <span style={{ float: "right", color: "#0070f3", fontWeight: 500 }}>
                {statusMap[order.TrangThai] || "-"}
              </span>
            </div>
            <div><b>Ngày đặt:</b> {order.NgayDatHang ? new Date(order.NgayDatHang).toLocaleString() : "-"}</div>
            <div><b>Người nhận:</b> {order.TenNguoiNhan}</div>
            <div><b>Địa chỉ:</b> {order.DiaChiNhan}</div>
            <div><b>SDT:</b> {order.SDTNguoiNhan}</div>
            <div><b>Email:</b> {order.EmailNguoiNhan}</div>
            <div><b>Thanh toán:</b> {order.tenHinhThucThanhToan}</div>
            <div><b>Vận chuyển:</b> {order.tenHinhThucVanChuyen}</div>
            <div><b>Tổng tiền:</b> {Number(order.TongThanhToan).toLocaleString()} đ</div>
            <div><b>Ghi chú:</b> {order.GhiChu || "-"}</div>
            <div style={{ marginTop: 12 }}>
              <b>Chi tiết sản phẩm:</b>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {order.chiTiet?.map((item) => {
                  let img = null
                  try {
                    const imgObj = JSON.parse(item.HinhAnh)
                    img = imgObj.anhChinh
                  } catch { }
                  return (
                    <li
                      key={item.id}
                      style={{
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {img && (
                        <img
                          src={img}
                          alt="sp"
                          style={{
                            width: 48,
                            height: 48,
                            objectFit: "cover",
                            borderRadius: 4,
                            marginRight: 12,
                          }}
                        />
                      )}
                      <div>
                        <div><b>{item.tenSanPham}</b></div>
                        <div>SL: {item.SoLuong} | Giá: {Number(item.GiaBan).toLocaleString()} đ</div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
            {order.TrangThai === 1 && (
              <button
                onClick={() => handleCancelOrder(order.id, order.MaDonHang || order.id)}
                style={{
                  marginTop: 12,
                  backgroundColor: "#ff4d4f",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                Hủy đơn hàng
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default OrdersPage
