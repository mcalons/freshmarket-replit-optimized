// client/src/pages/Cart.tsx

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { CartItem } from "@/components/CartItem"; // Este es un componente, no un tipo de schema
import {
  Lock,
  Trash2,
  CreditCard,
  Smartphone,
  User,
  Gift,
  Truck,
  Star,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { calculateCartTotal } from "@/lib/cart";
// Importamos getGuestCart y clearGuestCart, y el tipo GuestCartItem que ahora es compatible
import {
  getGuestCart,
  clearGuestCart,
  updateGuestCartItem,
  removeFromGuestCart,
  GuestCartItem,
  PopulatedCartItem,
} from "@/lib/guestCart"; // <-- Importa PopulatedCartItem también
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// --- IMPORTAR TIPOS DE @shared/schema ---
import {
  type CartItem as SchemaCartItem, // Renombrado para evitar conflicto con el componente CartItem
  type Product,
  type Category,
  type InsertOrder,
} from "@shared/schema";

// !!! IMPORTANTE: Elimina esta definición si ya la tienes en guestCart.ts y la importas.
// Si no, asegúrate de que sea idéntica.
// type PopulatedCartItem = SchemaCartItem & { product: Product & { category: Category } };

export default function Cart() {
  const [paymentMethod, setPaymentMethod] = useState("bizum");
  // guestCartItems ahora es de tipo GuestCartItem[], que es compatible con PopulatedCartItem[]
  const [guestCartItems, setGuestCartItems] = useState<GuestCartItem[]>([]);
  const [guestInfo, setGuestInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: authCartItems = [], isLoading } = useQuery<PopulatedCartItem[]>(
    {
      queryKey: ["/api/cart"],
      enabled: isAuthenticated,
    },
  );

  // Load guest cart from localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      // getGuestCart() ahora devuelve GuestCartItem[], que (con los cambios en guestCart.ts)
      // es compatible con PopulatedCartItem[].
      // No necesitamos una aserción `as PopulatedCartItem[]` aquí si los tipos son compatibles.
      setGuestCartItems(getGuestCart());
    }
  }, [isAuthenticated]);

  // `cartItems` ahora es inferido correctamente como `(PopulatedCartItem)[]`
  // porque GuestCartItem ahora es compatible con PopulatedCartItem
  const cartItems: PopulatedCartItem[] = isAuthenticated
    ? authCartItems
    : guestCartItems;

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (isAuthenticated) {
        return apiRequest("DELETE", "/api/cart");
      } else {
        clearGuestCart();
        return Promise.resolve({} as { message?: string });
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      } else {
        setGuestCartItems([]); // Reiniciar el estado local del carrito de invitados
        queryClient.invalidateQueries({ queryKey: ["guestCart"] }); // Invalida el caché si usas react-query para invitados
      }
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (
      orderData: Omit<
        InsertOrder,
        "userId" | "total" | "createdAt" | "updatedAt" | "status"
      >,
    ) => {
      if (isAuthenticated) {
        return apiRequest("POST", "/api/orders", {
          paymentMethod: orderData.paymentMethod,
          deliveryAddress:
            orderData.deliveryAddress || "Default delivery address",
        });
      } else {
        // En un caso real, un pedido de invitado no se guardaría en la DB sin autenticación
        // Esta es una simulación.
        return Promise.resolve({
          id: Date.now(),
          message: "Guest order created successfully",
        } as any);
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      } else {
        clearGuestCart();
        setGuestCartItems([]); // Reiniciar el estado local del carrito de invitados
        queryClient.invalidateQueries({ queryKey: ["guestCart"] });
      }
      toast({
        title: "Order placed successfully!",
        description:
          "Thank you for your order. You will receive a confirmation email shortly.",
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

  const {
    subtotal,
    discount,
    discountedSubtotal,
    delivery,
    total,
    hasDiscount,
    hasFreeShipping,
  } = calculateCartTotal(cartItems, isAuthenticated);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-background shadow-sm border-b">
        <div className="container mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
          <p className="text-muted-foreground mt-2">
            Review your items before checkout
          </p>
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
                    {cartItems.map((item: PopulatedCartItem) => (
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
                      <span className="text-lg font-bold text-primary">
                        €{total}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      asChild
                    >
                      <Link href="/checkout">
                        <Lock className="w-4 h-4 mr-2" />
                        Proceed to Checkout
                      </Link>
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

/*
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
  const [guestCartItems, setGuestCartItems] = useState<any[]>([]);
  const [guestInfo, setGuestInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: authCartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
  });

  // Load guest cart from localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      setGuestCartItems(getGuestCart());
    }
  }, [isAuthenticated]);

  const cartItems = isAuthenticated ? authCartItems : guestCartItems;

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (isAuthenticated) {
        return apiRequest("DELETE", "/api/cart");
      } else {
        clearGuestCart();
        return Promise.resolve({} as any);
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      } else {
        setGuestCartItems([]);
      }
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (isAuthenticated) {
        return apiRequest("POST", "/api/orders", {
          paymentMethod,
          deliveryAddress: guestInfo.address || "Default delivery address",
        });
      } else {
        // For guest orders, simulate successful order
        return Promise.resolve({ 
          id: Date.now(), 
          message: "Guest order created successfully" 
        } as any);
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      } else {
        clearGuestCart();
        setGuestCartItems([]);
      }
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

  // Remove the login requirement - allow guest shopping

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

  const { subtotal, discount, discountedSubtotal, delivery, total, hasDiscount, hasFreeShipping } = calculateCartTotal(cartItems as any[], isAuthenticated);

  return (
    <div className="min-h-screen">
      // Header 
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
            // Cart Items 
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

            // Order Summary 
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  // Totals 
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

                  // Actions 
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      asChild
                    >
                      <Link href="/checkout">
                        <Lock className="w-4 h-4 mr-2" />
                        Proceed to Checkout
                      </Link>
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
*/
