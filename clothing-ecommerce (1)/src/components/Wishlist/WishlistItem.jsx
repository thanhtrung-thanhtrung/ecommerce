"use client";

import { Link } from "react-router-dom";
import { Trash, ShoppingCart } from "lucide-react";
import { formatCurrency } from "../../utils/helpers";

const WishlistItem = ({ item, onRemove, onAddToCart }) => {
  let imageUrl = "/placeholder.svg?height=60&width=60";
  try {
    if (item.HinhAnh) {
      const imgObj =
        typeof item.HinhAnh === "string" ? JSON.parse(item.HinhAnh) : item.HinhAnh;
      if (imgObj.anhChinh) imageUrl = imgObj.anhChinh;
    }
  } catch { }

  return (
    <li style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', padding: 8 }}>
      <img
        src={imageUrl}
        alt={item.tenSanPham}
        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, marginRight: 12 }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>{item.tenSanPham}</div>
        <div style={{ color: '#888', fontSize: 13 }}>{Number(item.Gia).toLocaleString()}₫</div>
      </div>
      <button
        onClick={() => onAddToCart(item)}
        style={{ marginRight: 8, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}
      >
        Thêm vào giỏ
      </button>
      <button
        onClick={() => onRemove(item.id_SanPham)}
        style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}
      >
        Xóa
      </button>
    </li>
  );
};

export default WishlistItem;
