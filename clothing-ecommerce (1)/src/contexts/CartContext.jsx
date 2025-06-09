import React, { createContext, useContext } from 'react';
import useCart from '../hooks/useCart';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const cartData = useCart();

  return (
    <CartContext.Provider value={cartData}>
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};

export default CartContext;