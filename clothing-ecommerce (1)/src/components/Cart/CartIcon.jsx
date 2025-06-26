import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCartContext } from '../../contexts/CartContext';
import { Button } from '../ui/button';

const CartIcon = ({ onClick, className = '' }) => {
  const { totalItems, loading } = useCartContext();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`relative p-2 ${className}`}
      disabled={loading}
    >
      <ShoppingBag className="h-6 w-6" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Button>
  );
};

export default CartIcon;