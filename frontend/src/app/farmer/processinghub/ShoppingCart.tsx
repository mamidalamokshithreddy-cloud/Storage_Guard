import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ShoppingCart, Minus, Plus, Trash2, CreditCard, Truck } from "lucide-react";
import { Separator } from "../ui/separator";

interface CartItem {
  id: string;
  name: string;
  nameTelugu: string;
  price: number;
  image: string;
  weight: string;
  quantity: number;
  farmOrigin: string;
  farmOriginTelugu: string;
}

interface ShoppingCartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (_id: string, _quantity: number) => void;
  onRemoveItem: (_id: string) => void;
  onCheckout: () => void;
}

const ShoppingCartComponent = ({ cartItems, onUpdateQuantity, onRemoveItem, onCheckout }: ShoppingCartProps) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryCharge = subtotal > 500 ? 0 : 50;
  const packagingCharge = 25;
  const total = subtotal + deliveryCharge + packagingCharge;

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    // Simulate checkout process
    setTimeout(() => {
      onCheckout();
      setIsCheckingOut(false);
    }, 2000);
  };

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground">Add some fresh products to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cart Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Your Cart | మీ కార్ట్ ({cartItems.length} items)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <img 
                src={item.image} 
                alt={item.name}
                className="w-16 h-16 object-cover rounded"
              />
              
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-primary">{item.nameTelugu}</p>
                <p className="text-xs text-muted-foreground">
                  From: {item.farmOrigin} | {item.farmOriginTelugu}
                </p>
                <p className="text-sm text-muted-foreground">{item.weight}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-lg">₹{item.price * item.quantity}</p>
                <p className="text-sm text-muted-foreground">₹{item.price} each</p>
              </div>
              
              <Button 
                size="icon" 
                variant="ghost" 
                className="text-red-500 hover:text-red-700"
                onClick={() => onRemoveItem(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary | ఆర్డర్ సారాంశం</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal ({cartItems.length} items)</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charges</span>
              <span className={deliveryCharge === 0 ? "text-green-600 font-medium" : ""}>
                {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Eco-Packaging</span>
              <span>₹{packagingCharge}</span>
            </div>
            {deliveryCharge === 0 && (
              <Badge className="bg-green-500 text-white">
                🎉 Free delivery on orders above ₹500
              </Badge>
            )}
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Delivery Information
              </h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>• Fresh products delivered within 24 hours</p>
                <p>• Temperature-controlled transportation</p>
                <p>• Direct from farm to your doorstep</p>
                <p>• SMS tracking updates in Telugu & English</p>
              </div>
            </div>

            <Button 
              className="w-full agri-button-primary text-lg h-12"
              onClick={handleCheckout}
              disabled={isCheckingOut}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              {isCheckingOut ? "Processing..." : `Proceed to Checkout - ₹${total}`}
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Badge variant="outline" className="justify-center py-2">
                🔒 Secure Payment
              </Badge>
              <Badge variant="outline" className="justify-center py-2">
                📱 Digital Receipt
              </Badge>
              <Badge variant="outline" className="justify-center py-2">
                💚 Eco-Friendly
              </Badge>
              <Badge variant="outline" className="justify-center py-2">
                🌾 Farm Fresh
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              By proceeding, you agree to our terms and support local farmers directly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShoppingCartComponent;