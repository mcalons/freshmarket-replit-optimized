// client/src/pages/Customers.tsx

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User,
  ShoppingBag,
  MapPin,
  CreditCard,
  LogOut,
  Package,
  Truck,
  Calendar,
  Eye,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

// --- IMPORTAR TIPOS DE @shared/schema ---
import {
  type User as SchemaUser, // Renombrado para evitar conflicto con el icono User
  type Order,
  type OrderItem,
  type Product,
} from "@shared/schema";

// Definir el tipo esperado para una orden (con orderItems y productos anidados)
type PopulatedOrder = Order & {
  orderItems: Array<OrderItem & { product: Product }>;
};

// Definir el tipo de retorno de useAuth si no está ya definido en hooks/useAuth.ts
// Esta es una solución temporal si useAuth no devuelve los tipos correctos.
// Lo ideal sería tipar useAuth correctamente en su propio archivo.
type UseAuthReturn = {
  user: SchemaUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export default function Customers() {
  // Aseguramos que user, isAuthenticated, isLoading estén correctamente tipados
  // mediante un casting si useAuth no los devuelve ya con los tipos correctos.
  const { user, isAuthenticated, isLoading } = useAuth() as UseAuthReturn; // <--- CORRECCIÓN CLAVE AQUÍ

  // --- TIPADO DE useQuery PARA orders ---
  const { data: orders = [] } = useQuery<PopulatedOrder[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-transit":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <Package className="h-4 w-4" />;
      case "in-transit":
        return <Truck className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <div className="bg-background shadow-sm border-b">
          <div className="container mx-auto px-8 py-6">
            <h1 className="text-3xl font-bold text-foreground">My Account</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account and view order history
            </p>
          </div>
        </div>

        {/* Login Prompt */}
        <div className="container mx-auto px-8 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="pt-6 text-center">
                <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">
                  Welcome to FreshMarket
                </h2>
                <p className="text-muted-foreground mb-6">
                  Sign in to access your account, track orders, and manage your
                  profile.
                </p>
                <Button asChild className="w-full">
                  <a href="/api/login">Sign In with Replit</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-background shadow-sm border-b">
        <div className="container mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-foreground">My Account</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account and view order history
          </p>
        </div>
      </div>

      <div className="container mx-auto px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    {/* user ahora está tipado correctamente */}
                    <AvatarImage
                      src={user?.profileImageUrl || undefined} // Puede ser undefined si profileImageUrl es null o no existe
                      alt={user?.firstName || "User"}
                    />
                    <AvatarFallback>
                      {user?.firstName?.[0] || ""}
                      {user?.lastName?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold text-foreground">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <Button variant="ghost" className="w-full justify-start">
                    <ShoppingBag className="h-4 w-4 mr-3" />
                    Order History
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <User className="h-4 w-4 mr-3" />
                    Edit Profile
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <MapPin className="h-4 w-4 mr-3" />
                    Addresses
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <CreditCard className="h-4 w-4 mr-3" />
                    Payment Methods
                  </Button>
                  <Separator className="my-3" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    asChild
                  >
                    <a href="/api/logout">
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {/* orders.length === 0 ahora es seguro */}
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No orders yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Start shopping to see your orders here.
                    </p>
                    <Button asChild>
                      <Link href="/shop">Start Shopping</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* order en el map ahora está tipado correctamente */}
                    {orders.map((order: PopulatedOrder) => (
                      <div
                        key={order.id}
                        className="border border-border rounded-lg p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              Order #{order.id.toString().padStart(8, "0")}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {/* CORRECCIÓN: Comprobación de nulidad para order.createdAt */}
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    },
                                  )
                                : "N/A"}{" "}
                              {/* Muestra "N/A" o similar si es null */}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">
                              €{order.total}
                            </p>
                            <Badge
                              variant="outline"
                              className={getStatusColor(order.status)}
                            >
                              {getStatusIcon(order.status)}
                              <span className="ml-1 capitalize">
                                {order.status}
                              </span>
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-1" />
                            {/* Acceso seguro a orderItems */}
                            <span>{order.orderItems?.length || 0} items</span>
                          </div>
                          <div className="flex items-center">
                            <Truck className="h-4 w-4 mr-1" />
                            <span>
                              {order.status === "delivered"
                                ? "Delivered to home"
                                : order.status === "in-transit"
                                  ? "In transit"
                                  : "Processing"}
                            </span>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reorder
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
/*
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  ShoppingBag, 
  MapPin, 
  CreditCard, 
  LogOut,
  Package,
  Truck,
  Calendar,
  Eye,
  RotateCcw
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function Customers() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-transit":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <Package className="h-4 w-4" />;
      case "in-transit":
        return <Truck className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        // Header 
        <div className="bg-background shadow-sm border-b">
          <div className="container mx-auto px-8 py-6">
            <h1 className="text-3xl font-bold text-foreground">My Account</h1>
            <p className="text-muted-foreground mt-2">Manage your account and view order history</p>
          </div>
        </div>

        // Login Prompt 
        <div className="container mx-auto px-8 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="pt-6 text-center">
                <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">Welcome to FreshMarket</h2>
                <p className="text-muted-foreground mb-6">
                  Sign in to access your account, track orders, and manage your profile.
                </p>
                <Button asChild className="w-full">
                  <a href="/api/login">Sign In with Replit</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      // Header 
      <div className="bg-background shadow-sm border-b">
        <div className="container mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-foreground">My Account</h1>
          <p className="text-muted-foreground mt-2">Manage your account and view order history</p>
        </div>
      </div>

      <div className="container mx-auto px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          // Profile Sidebar 
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || "User"} />
                    <AvatarFallback>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold text-foreground">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-3">
                  <Button variant="ghost" className="w-full justify-start">
                    <ShoppingBag className="h-4 w-4 mr-3" />
                    Order History
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <User className="h-4 w-4 mr-3" />
                    Edit Profile
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <MapPin className="h-4 w-4 mr-3" />
                    Addresses
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <CreditCard className="h-4 w-4 mr-3" />
                    Payment Methods
                  </Button>
                  <Separator className="my-3" />
                  <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" asChild>
                    <a href="/api/logout">
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          // Main Content 
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start shopping to see your orders here.
                    </p>
                    <Button asChild>
                      <Link href="/shop">Start Shopping</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order: any) => (
                      <div key={order.id} className="border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              Order #{order.id.toString().padStart(8, '0')}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">€{order.total}</p>
                            <Badge variant="outline" className={getStatusColor(order.status)}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1 capitalize">{order.status}</span>
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-1" />
                            <span>{order.orderItems?.length || 0} items</span>
                          </div>
                          <div className="flex items-center">
                            <Truck className="h-4 w-4 mr-1" />
                            <span>
                              {order.status === "delivered" 
                                ? "Delivered to home" 
                                : order.status === "in-transit"
                                ? "In transit"
                                : "Processing"
                              }
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-3">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reorder
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
*/
