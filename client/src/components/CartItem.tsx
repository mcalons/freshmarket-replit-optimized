import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth"; // Importa useAuth
// Importamos las funciones de guestCart y el tipo PopulatedCartItem
import {
  updateGuestCartItem,
  removeFromGuestCart,
  PopulatedCartItem,
} from "@/lib/guestCart";

interface CartItemProps {
  item: PopulatedCartItem; // Ahora `item` es de tipo PopulatedCartItem
}

export function CartItem({ item }: CartItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth(); // Obtener el estado de autenticación

  const updateQuantityMutation = useMutation({
    mutationFn: async (newQuantity: number) => {
      if (isAuthenticated) {
        // Lógica para usuarios autenticados (API)
        return apiRequest("PUT", `/api/cart/${item.id}`, {
          quantity: newQuantity,
        });
      } else {
        // Lógica para usuarios invitados (localStorage)
        // Nota: updateGuestCartItem ahora espera productId, no item.id si item.id es un string
        // Como hemos cambiado guestCart.ts para que item.id sea productId, esto debería funcionar
        updateGuestCartItem(item.productId, newQuantity);
        // Devolver una promesa resuelta para satisfacer el tipo de mutationFn
        return Promise.resolve({} as any);
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      } else {
        // Invalida la query para el carrito de invitado si usas react-query para este
        // O simplemente actualiza el estado local en Cart.tsx si no es una query.
        queryClient.invalidateQueries({ queryKey: ["guestCart"] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async () => {
      if (isAuthenticated) {
        // Lógica para usuarios autenticados (API)
        return apiRequest("DELETE", `/api/cart/${item.id}`);
      } else {
        // Lógica para usuarios invitados (localStorage)
        // removeFromGuestCart ahora espera productId, no item.id si item.id es un string
        removeFromGuestCart(item.productId);
        // Devolver una promesa resuelta
        return Promise.resolve({} as any);
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      } else {
        // Invalida la query para el carrito de invitado si se usa
        queryClient.invalidateQueries({ queryKey: ["guestCart"] });
      }
      toast({
        title: "Item removed",
        description: `${item.product.name} has been removed from your cart.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    },
  });

  const handleQuantityChange = (change: number) => {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      updateQuantityMutation.mutate(newQuantity);
    }
  };

  const itemTotal = (parseFloat(item.product.price) * item.quantity).toFixed(2);

  return (
    <div className="flex items-center space-x-4 p-6">
      <img
        // Usa un fallback para imageUrl si es null
        src={item.product.imageUrl || "/placeholder-image.jpg"}
        alt={item.product.name}
        className="w-16 h-16 object-cover rounded-lg"
      />

      <div className="flex-1">
        <h3 className="font-semibold text-foreground">{item.product.name}</h3>
        <p className="text-muted-foreground">
          €{item.product.price}/{item.product.unit}
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(-1)}
          disabled={updateQuantityMutation.isPending || item.quantity <= 1}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <span className="w-8 text-center font-semibold">{item.quantity}</span>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(1)}
          disabled={updateQuantityMutation.isPending}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-right">
        <p className="font-semibold text-foreground">€{itemTotal}</p>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive mt-1"
          onClick={() => removeItemMutation.mutate()}
          disabled={removeItemMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </div>
    </div>
  );
}

/*
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CartItemProps {
  item: {
    id: number;
    quantity: number;
    product: {
      id: number;
      name: string;
      price: string;
      unit: string;
      imageUrl: string;
    };
  };
}

export function CartItem({ item }: CartItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateQuantityMutation = useMutation({
    mutationFn: async (newQuantity: number) => {
      return apiRequest("PUT", `/api/cart/${item.id}`, { quantity: newQuantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/cart/${item.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: `${item.product.name} has been removed from your cart.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    },
  });

  const handleQuantityChange = (change: number) => {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      updateQuantityMutation.mutate(newQuantity);
    }
  };

  const itemTotal = (parseFloat(item.product.price) * item.quantity).toFixed(2);

  return (
    <div className="flex items-center space-x-4 p-6">
      <img 
        src={item.product.imageUrl} 
        alt={item.product.name}
        className="w-16 h-16 object-cover rounded-lg"
      />
      
      <div className="flex-1">
        <h3 className="font-semibold text-foreground">{item.product.name}</h3>
        <p className="text-muted-foreground">€{item.product.price}/{item.product.unit}</p>
      </div>
      
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(-1)}
          disabled={updateQuantityMutation.isPending || item.quantity <= 1}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <span className="w-8 text-center font-semibold">
          {item.quantity}
        </span>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(1)}
          disabled={updateQuantityMutation.isPending}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="text-right">
        <p className="font-semibold text-foreground">€{itemTotal}</p>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive mt-1"
          onClick={() => removeItemMutation.mutate()}
          disabled={removeItemMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </div>
    </div>
  );
}
*/
