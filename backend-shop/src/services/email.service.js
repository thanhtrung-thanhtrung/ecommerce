const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER?.trim(),
        pass: process.env.EMAIL_PASS?.trim(),
      },
    });
  }

  getOrderStatusTemplate(orderData, status) {
    const statusTemplates = {
      confirmed: {
        subject: `✅ Đơn hàng #${orderData.id} đã được xác nhận`,
        title: "Đã xác nhận",
        message: "Đơn hàng đang được chuẩn bị",
        color: "#22c55e",
        icon: "✅",
      },
      processing: {
        subject: `📦 Đơn hàng #${orderData.id} đang xử lý`,
        title: "Đang xử lý",
        message: "Đang đóng gói sản phẩm",
        color: "#3b82f6",
        icon: "📦",
      },
      shipping: {
        subject: `🚚 Đơn hàng #${orderData.id} đang giao`,
        title: "Đang giao hàng",
        message: "Đơn hàng đang trên đường đến bạn",
        color: "#8b5cf6",
        icon: "🚚",
      },
      delivered: {
        subject: `✅ Đơn hàng #${orderData.id} đã giao thành công`,
        title: "Giao thành công",
        message: "Cảm ơn bạn đã mua hàng",
        color: "#10b981",
        icon: "🎉",
      },
      cancelled: {
        subject: `❌ Đơn hàng #${orderData.id} đã hủy`,
        title: "Đã hủy",
        message: "Đơn hàng đã được hủy",
        color: "#ef4444",
        icon: "❌",
      },
    };
    return statusTemplates[status] || statusTemplates.confirmed;
  }

  createEmailHTML(orderData, status, template) {
    const formatCurrency = (amount) =>
      new Intl.NumberFormat("vi-VN").format(amount) + "₫";

    const formatDate = (date) => new Date(date).toLocaleDateString("vi-VN");

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.subject}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5; 
            color: #374151;
            background: #f9fafb;
        }
        .container { 
            max-width: 100%; 
            margin: 0 auto; 
            background: #fff;
        }
        @media (min-width: 640px) { 
            .container { max-width: 600px; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        }
        .header { 
            background: linear-gradient(135deg, ${template.color}, ${
      template.color
    }dd);
            color: white; 
            padding: 20px; 
            text-align: center; 
        }
        .header h1 { font-size: 20px; margin-bottom: 8px; }
        .status-badge { 
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }
        .content { padding: 20px; }
        .greeting { font-size: 16px; margin-bottom: 16px; }
        .message { 
            background: #f3f4f6;
            padding: 16px;
            border-radius: 8px;
            margin: 16px 0;
            border-left: 4px solid ${template.color};
        }
        .order-info { 
            background: #f9fafb;
            padding: 16px;
            border-radius: 8px;
            margin: 16px 0;
        }
        .order-info h3 { color: #111827; margin-bottom: 12px; font-size: 16px; }
        .info-row { 
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #6b7280; font-size: 14px; }
        .info-value { font-weight: 500; font-size: 14px; text-align: right; max-width: 60%; word-break: break-word; }
        .products { margin: 16px 0; }
        .product-item { 
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .product-item:last-child { border-bottom: none; }
        .product-info { flex: 1; }
        .product-name { font-weight: 500; font-size: 14px; }
        .product-details { color: #6b7280; font-size: 12px; }
        .product-price { 
            text-align: right;
            font-weight: 500;
            color: ${template.color};
        }
        .total { 
            background: #f3f4f6;
            padding: 12px;
            border-radius: 6px;
            text-align: center;
            font-weight: 600;
            font-size: 16px;
            color: ${template.color};
        }
        .track-btn { 
            display: block;
            width: 100%;
            background: ${template.color};
            color: white;
            text-decoration: none;
            padding: 12px;
            border-radius: 6px;
            text-align: center;
            font-weight: 500;
            margin: 20px 0;
        }
        .footer { 
            background: #f9fafb;
            padding: 16px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
        }
        .footer strong { color: #374151; }
        @media (max-width: 480px) {
            .info-row { flex-direction: column; align-items: flex-start; }
            .info-value { max-width: 100%; text-align: left; margin-top: 4px; }
            .product-item { flex-direction: column; align-items: flex-start; gap: 8px; }
            .product-price { text-align: left; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👟 SHOES SHOP</h1>
            <div class="status-badge">
                <span>${template.icon}</span>
                <span>${template.title}</span>
            </div>
        </div>
        
        <div class="content">
            <div class="greeting">
                Xin chào <strong>${orderData.TenNguoiNhan}</strong>!
            </div>
            
            <div class="message">
                ${template.message}
            </div>
            
            <div class="order-info">
                <h3>📋 Thông tin đơn hàng</h3>
                <div class="info-row">
                    <span class="info-label">Mã đơn hàng</span>
                    <span class="info-value">#${orderData.id}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ngày đặt</span>
                    <span class="info-value">${formatDate(
                      orderData.NgayDatHang
                    )}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Địa chỉ giao</span>
                    <span class="info-value">${orderData.DiaChiNhan}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Số điện thoại</span>
                    <span class="info-value">${orderData.SDTNguoiNhan}</span>
                </div>
            </div>

            ${
              orderData.chiTiet && orderData.chiTiet.length > 0
                ? `
            <div class="products">
                <h3>📦 Sản phẩm đã đặt</h3>
                ${orderData.chiTiet
                  .map(
                    (item) => `
                    <div class="product-item">
                        <div class="product-info">
                            <div class="product-name">${item.tenSanPham}</div>
                            <div class="product-details">${item.tenKichCo} - ${
                      item.tenMauSac
                    } | SL: ${item.SoLuong}</div>
                        </div>
                        <div class="product-price">
                            ${formatCurrency(item.Gia * item.SoLuong)}
                        </div>
                    </div>
                `
                  )
                  .join("")}
            </div>
            `
                : ""
            }

            <div class="total">
                Tổng cộng: ${formatCurrency(orderData.TongThanhToan)}
            </div>

            <a href="${process.env.FRONTEND_URL}/track-order" class="track-btn">
                🔍 Theo dõi đơn hàng
            </a>

            <div class="order-info">
                <h3>💡 Thông tin tra cứu</h3>
                <div class="info-row">
                    <span class="info-label">Mã đơn hàng</span>
                    <span class="info-value">#${orderData.id}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email tra cứu</span>
                    <span class="info-value">${orderData.EmailNguoiNhan}</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div><strong>SHOES SHOP</strong></div>
            <div>📞 1900-1234 | 📧 support@shoesshop.vn</div>
            <div>Cảm ơn bạn đã tin tưởng mua sắm!</div>
        </div>
    </div>
</body>
</html>`;
  }

  async sendOrderStatusUpdate(orderData, newStatus, note = null) {
    try {
      const template = this.getOrderStatusTemplate(orderData, newStatus);
      const htmlContent = this.createEmailHTML(orderData, newStatus, template);

      const mailOptions = {
        from: {
          name: "Shoes Shop",
          address: process.env.EMAIL_USER,
        },
        to: orderData.EmailNguoiNhan,
        subject: template.subject,
        html: htmlContent,
        text: `
Xin chào ${orderData.TenNguoiNhan},

${template.message}

Đơn hàng: #${orderData.id}
Ngày đặt: ${new Date(orderData.NgayDatHang).toLocaleDateString("vi-VN")}
Tổng tiền: ${new Intl.NumberFormat("vi-VN").format(orderData.TongThanhToan)}₫

${note ? `Ghi chú: ${note}` : ""}

Tra cứu đơn hàng: ${process.env.FRONTEND_URL}/track-order
Sử dụng mã #${orderData.id} và email ${orderData.EmailNguoiNhan}

Cảm ơn bạn đã mua sắm tại Shoes Shop!
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId,
        recipient: orderData.EmailNguoiNhan,
      };
    } catch (error) {
      throw new Error(`Không thể gửi email: ${error.message}`);
    }
  }

  async sendOrderConfirmation(orderData) {
    return this.sendOrderStatusUpdate(orderData, "confirmed");
  }
}

module.exports = new EmailService();
