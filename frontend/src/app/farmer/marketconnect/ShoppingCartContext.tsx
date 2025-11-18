import { createContext, useContext, useState, ReactNode } from "react";

interface Product {
  id: string;
  name: string;
  nameTelugu: string;
  price: number;
  image: string;
  weight: string;
  farmOrigin: string;
  farmOriginTelugu: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface ShoppingCartContextType {
  cartItems: CartItem[];
  cartItemsMap: { [key: string]: number };
  addToCart: (_product: Product, _quantity: number) => void;
  updateQuantity: (_id: string, _quantity: number) => void;
  removeFromCart: (_id: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalAmount: () => number;
}

const ShoppingCartContext = createContext<ShoppingCartContextType | null>(null);

export const useShoppingCart = () => {
  const context = useContext(ShoppingCartContext);
  if (!context) {
    throw new Error("useShoppingCart must be used within a ShoppingCartProvider");
  }
  return context;
};

interface ShoppingCartProviderProps {
  children: ReactNode;
}

export const ShoppingCartProvider = ({ children }: ShoppingCartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const cartItemsMap = cartItems.reduce((acc, item) => {
    acc[item.id] = item.quantity;
    return acc;
  }, {} as { [key: string]: number });

  const addToCart = (product: Product, quantity: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevItems, { ...product, quantity }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const contextValue: ShoppingCartContextType = {
    cartItems,
    cartItemsMap,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalAmount
  };

  return (
    <ShoppingCartContext.Provider value={contextValue}>
      {children}
    </ShoppingCartContext.Provider>
  );
};