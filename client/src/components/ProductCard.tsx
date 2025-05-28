import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Check } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { addToGuestCart } from "@/lib/guestCart";

// Importa los tipos directamente desde @shared/schema
// Es crucial que estos sean los tipos que representan tu esquema de base de datos
import { type Product, type Category } from "@shared/schema";

// Modifica la interfaz ProductCardProps para que use el tipo Product importado
interface ProductCardProps {
  // Ahora, 'product' debe coincidir con la estructura de Product del esquema.
  // Si tu componente ProductCard NO NECESITA TODOS los campos del schema Product
  // podrías crear un nuevo tipo 'ProductCardProduct' que solo contenga los campos necesarios
  // pero para solucionar este error y unificar, usaremos el tipo Product completo.
  product: Product & { category: Category }; // Asegúrate de incluir la categoría completa
}

export function ProductCard({ product }: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (isAuthenticated) {
        return apiRequest("POST", "/api/cart", {
          productId: product.id,
          quantity: 1,
        });
      } else {
        // Ahora 'product' es de tipo Product & { category: Category }
        // lo cual es lo que addToGuestCart espera, resolviendo el error.
        addToGuestCart(product, 1);
        return Promise.resolve({} as any);
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      }
      // También invalida si estás usando react-query para el carrito de invitados
      queryClient.invalidateQueries({ queryKey: ["guestCart"] });
      setIsAdded(true);
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });

      setTimeout(() => setIsAdded(false), 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = () => {
    addToCartMutation.mutate();
  };

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <Link href={`/product/${product.id}`}>
        <div className="relative overflow-hidden cursor-pointer">
          <img
            // Asegúrate de manejar product.imageUrl si puede ser null en tu esquema Product
            src={product.imageUrl || "/placeholder-image.jpg"}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Asegúrate de que product.isOrganic exista en tu Product del esquema */}
          {product.isOrganic && (
            <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
              Organic
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="text-lg font-semibold text-foreground mb-2 hover:text-primary transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>
        {/* Asegúrate de que product.description exista en tu Product del esquema */}
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">
            €{product.price}/{product.unit}
          </span>
          <Button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending}
            className={`transition-colors ${
              isAdded
                ? "bg-green-600 hover:bg-green-700"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Added
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
/*
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Check } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { addToGuestCart } from "@/lib/guestCart";

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  unit: string;
  imageUrl: string;
  isOrganic: boolean;
  category: {
    name: string;
  };
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (isAuthenticated) {
        return apiRequest("POST", "/api/cart", {
          productId: product.id,
          quantity: 1,
        });
      } else {
        // Add to guest cart using localStorage
        addToGuestCart(product, 1);
        return Promise.resolve({} as any);
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      }
      setIsAdded(true);
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
      
      setTimeout(() => setIsAdded(false), 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = () => {
    addToCartMutation.mutate();
  };

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <Link href={`/product/${product.id}`}>
        <div className="relative overflow-hidden cursor-pointer">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.isOrganic && (
            <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
              Organic
            </Badge>
          )}
        </div>
      </Link>
      
      <CardContent className="p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="text-lg font-semibold text-foreground mb-2 hover:text-primary transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">
            €{product.price}/{product.unit}
          </span>
          <Button 
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending}
            className={`transition-colors ${
              isAdded 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Added
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
*/
