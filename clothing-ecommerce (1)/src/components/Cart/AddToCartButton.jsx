import React, { useState } from "react";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { useCartContext } from "../../contexts/CartContext";
import { Button } from "../ui/button";
import { toast } from "react-hot-toast";

const AddToCartButton = ({
  productId,
  sizeId,
  colorId,
  quantity = 1,
  variant = "default",
  size = "default",
  className = "",
  children,
  disabled = false,
}) => {
  const { addToCart, loading } = useCartContext();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = async () => {
    if (!productId || !sizeId || !colorId) {
      toast.error("Vui lòng chọn size và màu sắc");
      return;
    }

    setIsAdding(true);

    try {
      await addToCart({
        maSanPham: productId,
        maKichThuoc: sizeId,
        maMauSac: colorId,
        soLuong: quantity,
      });

      setJustAdded(true);
      toast.success("Đã thêm vào giỏ hàng");

      // Reset trạng thái sau 2 giây
      setTimeout(() => {
        setJustAdded(false);
      }, 2000);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi thêm vào giỏ hàng");
    } finally {
      setIsAdding(false);
    }
  };

  const isDisabled =
    disabled || loading || isAdding || !productId || !sizeId || !colorId;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={`transition-all duration-200 ${className}`}
    >
      {isAdding ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Đang thêm...
        </>
      ) : justAdded ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Đã thêm
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          {children || "Thêm vào giỏ"}
        </>
      )}
    </Button>
  );
};

export default AddToCartButton;
