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
