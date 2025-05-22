import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Initialize sample data on first visit
  useEffect(() => {
    apiRequest("POST", "/api/init-data").catch(() => {
      // Ignore errors if data already exists
    });
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products", selectedCategory],
    queryFn: () => {
      const url = selectedCategory === "all" 
        ? "/api/products" 
        : `/api/products?category=${selectedCategory}`;
      return fetch(url, { credentials: "include" }).then(res => res.json());
    },
  });

  const filterButtons = [
    { id: "all", name: "All Products" },
    ...categories.map((cat: any) => ({ id: cat.id.toString(), name: cat.name }))
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-background shadow-sm border-b">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Shop Fresh Produce</h1>
              <p className="text-muted-foreground mt-2">
                Discover our selection of premium organic fruits and vegetables
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {filterButtons.map((filter) => (
                <Button
                  key={filter.id}
                  variant={selectedCategory === filter.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(filter.id)}
                  className={selectedCategory === filter.id ? "bg-primary text-primary-foreground" : ""}
                >
                  {filter.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              No products found
            </h3>
            <p className="text-muted-foreground">
              Try selecting a different category or check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
