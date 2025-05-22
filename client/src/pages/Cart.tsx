import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { CartItem } from "@/components/CartItem";
import { Lock, Trash2, CreditCard, Smartphone, User, Gift, Truck, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { calculateCartTotal } from "@/lib/cart";
import { getGuestCart, clearGuestCart } from "@/lib/guestCart";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Cart() {
  const [paymentMethod, setPaymentMethod] = useState("bizum");
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
  });

  const clearCartMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/cart"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/orders", {
      paymentMethod,
      deliveryAddress: "Default delivery address", // In a real app, this would come from user input
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order placed successfully!",
        description: "Thank you for your order. You will receive a confirmation email shortly.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Login Required</h2>
            <p className="text-muted-foreground mb-6">
              Please log in to view your shopping cart.
            </p>
            <Button asChild>
              <Link href="/customers">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your cart...</p>
        </div>
      </div>
    );
  }

  const { subtotal, delivery, total } = calculateCartTotal(cartItems);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-background shadow-sm border-b">
        <div className="container mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
          <p className="text-muted-foreground mt-2">Review your items before checkout</p>
        </div>
      </div>

      <div className="container mx-auto px-8 py-8">
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-muted-foreground mb-4">
              Your cart is empty
            </h3>
            <p className="text-muted-foreground mb-6">
              Start shopping to add items to your cart.
            </p>
            <Button asChild>
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Cart Items</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {cartItems.map((item: any) => (
                      <CartItem key={item.id} item={item} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Totals */}
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">€{subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="font-semibold">€{delivery}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-lg font-bold text-primary">€{total}</span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Payment Method</h3>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="bizum" id="bizum" />
                        <Label htmlFor="bizum" className="flex items-center space-x-2 cursor-pointer">
                          <Smartphone className="h-4 w-4 text-orange-500" />
                          <span>Bizum</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center space-x-2 cursor-pointer">
                          <CreditCard className="h-4 w-4 text-primary" />
                          <span>Credit Card</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => createOrderMutation.mutate()}
                      disabled={createOrderMutation.isPending}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      {createOrderMutation.isPending ? "Processing..." : "Proceed to Checkout"}
                    </Button>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => clearCartMutation.mutate()}
                      disabled={clearCartMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
