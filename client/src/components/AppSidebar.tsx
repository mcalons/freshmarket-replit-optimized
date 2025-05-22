import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Store, 
  ShoppingCart, 
  Mail, 
  User,
  Leaf
} from "lucide-react";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Shop", href: "/shop", icon: Store },
  { name: "Cart", href: "/cart", icon: ShoppingCart },
  { name: "Contact", href: "/contact", icon: Mail },
  { name: "Account", href: "/customers", icon: User },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { state } = useSidebar();

  // Get cart count
  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart"],
    enabled: false, // Will be enabled when user is authenticated
  });

  const cartCount = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className="border-r border-border/40">
      <SidebarHeader className={cn("border-b border-border/40", isCollapsed ? "p-4" : "p-6")}>
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "space-x-3")}>
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Leaf className="text-primary-foreground text-lg" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-foreground">FreshMarket</h1>
              <p className="text-sm text-muted-foreground">Organic Food Store</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarMenu className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild className={cn(
                  "w-full flex items-center rounded-lg transition-colors",
                  isCollapsed ? "justify-center px-3 py-3" : "space-x-3 px-4 py-3",
                  isActive 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}>
                  <Link href={item.href} title={isCollapsed ? item.name : undefined}>
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.name}</span>}
                    {!isCollapsed && item.name === "Cart" && cartCount > 0 && (
                      <Badge variant="secondary" className="ml-auto bg-orange-500 text-white text-xs">
                        {cartCount}
                      </Badge>
                    )}
                    {isCollapsed && item.name === "Cart" && cartCount > 0 && (
                      <Badge variant="secondary" className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center p-0">
                        {cartCount > 9 ? "9+" : cartCount}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
