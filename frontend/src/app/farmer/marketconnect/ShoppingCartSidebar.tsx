import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from "lucide-react";
import { useShoppingCart } from "../marketconnect/ShoppingCartContext";
import { toast } from "../../hooks/use-toast";

export default function ShoppingCartSidebar() {
  const { 
    cartItems, 
    getTotalItems, 
    getTotalAmount, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useShoppingCart();

  const deliveryCharge = 150;
  const packagingCharge = 50;
  const subtotal = getTotalAmount();
  const total = subtotal + deliveryCharge + packagingCharge;

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add some products to cart before checkout.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Order Placed Successfully!",
      description: `Your order of ₹${total.toLocaleString()} has been placed. You will receive a confirmation shortly.`,
    });
    clearCart();
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {getTotalItems() > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {getTotalItems()}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart ({getTotalItems()} items)
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">Add some products to get started</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                {cartItems.map(item => (
                  <div key={item.id} className="flex gap-3 p-3 border border-border rounded-lg">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">{item.nameTelugu}</p>
                      <p className="text-xs text-muted-foreground">{item.farmOrigin}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary">₹{item.price.toLocaleString()}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total: ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Order Summary */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({getTotalItems()} items):</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Charges:</span>
                  <span>₹{deliveryCharge}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Packaging Charges:</span>
                  <span>₹{packagingCharge}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-primary">₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                <p>🚚 Free delivery on orders above ₹10,000</p>
                <p>📦 Standard delivery: 2-3 business days</p>
                <p>🔄 Easy returns within 7 days</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  className="w-full agri-button-primary" 
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={clearCart}
                  disabled={cartItems.length === 0}
                >
                  Clear Cart
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}