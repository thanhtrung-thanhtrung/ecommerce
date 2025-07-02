const WishlistItem = ({ item, onRemove }) => {
  let imageUrl = "/placeholder.svg?height=60&width=60";
  try {
    const imgObj = typeof item.HinhAnh === "string" ? JSON.parse(item.HinhAnh) : item.HinhAnh;
    if (imgObj?.anhChinh) imageUrl = imgObj.anhChinh;
  } catch (err) {
    console.error("Lỗi parse HinhAnh:", err);
  }

  const handleGoToProduct = () => {
    window.location.href = `/products/${item.id_SanPham}`;
  };

  return (
    <li style={{
      display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', padding: 8,
      background: '#fff', marginBottom: 2
    }}>
      <img
        src={imageUrl}
        alt={item.tenSanPham}
        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, marginRight: 10 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.tenSanPham}
        </div>
        <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
          {Number(item.Gia).toLocaleString()}₫
        </div>
      </div>
      <button
        onClick={handleGoToProduct}
        style={{
          marginRight: 6, background: '#2563eb', color: '#fff',
          border: 'none', borderRadius: 4, padding: '5px 12px',
          cursor: 'pointer', fontSize: 13, fontWeight: 500
        }}
      >
        Chọn mua
      </button>
      <button
        onClick={() => onRemove(item.id_SanPham)}
        style={{
          background: '#ef4444', color: '#fff', border: 'none',
          borderRadius: 4, padding: '5px 12px',
          cursor: 'pointer', fontSize: 13, fontWeight: 500
        }}
      >
        Xóa
      </button>
    </li>
  );
};
