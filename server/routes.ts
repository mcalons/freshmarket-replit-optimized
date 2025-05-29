// server/routes.ts
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js"; // Asegúrate de que este import sea correcto
// import { setupAuth, isAuthenticated } from "./replitAuth.js"; // ¡ELIMINAR O COMENTAR ESTA LÍNEA!
import {
  insertContactMessageSchema,
  insertCartItemSchema,
} from "../shared/schema.js";
import { z } from "zod";

// Importa el nuevo tipo si es necesario, o usa Omit<InsertOrderItem, 'orderId'> directamente
// Si `storage.ts` exporta `TemporaryOrderItem`, impórtalo:
// import { type TemporaryOrderItem } from "./storage"; // <-- Descomenta si exportas TemporaryOrderItem

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - ¡ELIMINAR ESTA LLAMADA!
  // await setupAuth(app);

  // Auth routes - Estas rutas ya no usarán isAuthenticated, o deberías eliminarlas si no tienes otro sistema de auth
  app.get("/api/auth/user", async (req: any, res) => { // Eliminado isAuthenticated
    // Si ya no usas autenticación de Replit, `req.user` será undefined.
    // Esta ruta necesitará una nueva lógica de autenticación o ser eliminada.
    try {
      // **IMPORTANTE:** `req.user` ya no será poblado por Replit Auth.
      // Si necesitas datos de usuario, deberás integrar una nueva estrategia de autenticación.
      // Por ahora, esta ruta puede devolver un error o datos de prueba si no hay autenticación.
      res.status(401).json({ message: "Authentication required" }); // O ajusta según tu necesidad
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const { category } = req.query;
      let products;

      if (category && typeof category === "string" && category !== "all") {
        const categoryId = parseInt(category);
        if (!isNaN(categoryId)) {
          products = await storage.getProductsByCategory(categoryId);
        } else {
          products = await storage.getProducts();
        }
      } else {
        products = await storage.getProducts();
      }

      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Cart routes (YA NO PROTEGIDAS POR isAuthenticated A MENOS QUE AÑADAS OTRO MIDDLEWARE)
  app.get("/api/cart", async (req: any, res) => { // Eliminado isAuthenticated
    try {
      // Si ya no hay autenticación, `req.user` será undefined.
      // Necesitarás una nueva forma de identificar al usuario (ej. token, ID de sesión)
      // O hacer que estas rutas no requieran un usuario logueado.
      res.status(401).json({ message: "Authentication required for cart operations" });
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req: any, res) => { // Eliminado isAuthenticated
    try {
      res.status(401).json({ message: "Authentication required to add to cart" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid cart item data", errors: error.errors });
      }
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.put("/api/cart/:id", async (req: any, res) => { // Eliminado isAuthenticated
    try {
      res.status(401).json({ message: "Authentication required to update cart" });
    } catch (error) {
      if (isNaN(id) || typeof quantity !== "number" || quantity < 1) {
        return res.status(400).json({ message: "Invalid data" });
      }
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req: any, res) => { // Eliminado isAuthenticated
    try {
      res.status(401).json({ message: "Authentication required to remove from cart" });
    } catch (error) {
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  app.delete("/api/cart", async (req: any, res) => { // Eliminado isAuthenticated
    try {
      res.status(401).json({ message: "Authentication required to clear cart" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Orders routes (YA NO PROTEGIDAS POR isAuthenticated)
  app.get("/api/orders", async (req: any, res) => { // Eliminado isAuthenticated
    try {
      res.status(401).json({ message: "Authentication required for orders" });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req: any, res) => { // Eliminado isAuthenticated
    try {
      res.status(401).json({ message: "Authentication required to create order" });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Contact routes (estas no requieren autenticación)
  app.post("/api/contact", async (req, res) => {
    try {
      const messageData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(messageData);

      // Here you would typically send an email
      // For now, we'll just store the message in the database

      res.json({ message: "Message sent successfully", id: message.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error sending contact message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Initialize sample data (no requiere autenticación)
  app.post("/api/init-data", async (req, res) => {
    try {
      // Check if categories exist
      const existingCategories = await storage.getCategories();
      if (existingCategories.length === 0) {
        // Create categories
        const fruitsCategory = await storage.createCategory({
          name: "Fruits",
          slug: "fruits",
        });

        const vegetablesCategory = await storage.createCategory({
          name: "Vegetables",
          slug: "vegetables",
        });

        // Create sample products
        const sampleProducts = [
          // Fruits
          {
            name: "Red Apples",
            description:
              "Sweet and crispy organic apples, perfect for snacking",
            price: "3.99",
            unit: "kg",
            imageUrl:
              "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: fruitsCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Bananas",
            description: "Naturally sweet and potassium-rich bananas",
            price: "2.49",
            unit: "kg",
            imageUrl:
              "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: fruitsCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Oranges",
            description: "Juicy Valencia oranges packed with vitamin C",
            price: "4.29",
            unit: "kg",
            imageUrl:
              "https://images.unsplash.com/photo-1547514701-42782101795e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: fruitsCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Strawberries",
            description: "Sweet and aromatic strawberries, locally grown",
            price: "6.99",
            unit: "kg",
            imageUrl:
              "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: fruitsCategory.id,
            isOrganic: true,
            inStock: true,
          },
          // Vegetables
          {
            name: "Tomatoes",
            description: "Vine-ripened tomatoes bursting with flavor",
            price: "5.49",
            unit: "kg",
            imageUrl:
              "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: vegetablesCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Lettuce",
            description: "Crisp and fresh iceberg lettuce for salads",
            price: "2.99",
            unit: "head",
            imageUrl:
              "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: vegetablesCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Carrots",
            description: "Sweet and crunchy carrots rich in beta-carotene",
            price: "3.49",
            unit: "kg",
            imageUrl:
              "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: vegetablesCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Broccoli",
            description: "Nutritious green broccoli packed with vitamins",
            price: "4.99",
            unit: "kg",
            imageUrl:
              "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: vegetablesCategory.id,
            isOrganic: true,
            inStock: true,
          },
        ];

        for (const productData of sampleProducts) {
          await storage.createProduct(productData);
        }
      }

      res.json({ message: "Sample data initialized" });
    } catch (error) {
      console.error("Error initializing data:", error);
      res.status(500).json({ message: "Failed to initialize data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}



//desactivo replitAuth.ts
/*

// server/routes.ts
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js"; // Asegúrate de que este import sea correcto
import { setupAuth, isAuthenticated } from "./replitAuth.js";
import {
  insertContactMessageSchema,
  insertCartItemSchema,
} from "../shared/schema.js"; // <-- MODIFICAR AQUÍ
//from "@shared/schema";
import { z } from "zod";

// Importa el nuevo tipo si es necesario, o usa Omit<InsertOrderItem, 'orderId'> directamente
// Si `storage.ts` exporta `TemporaryOrderItem`, impórtalo:
// import { type TemporaryOrderItem } from "./storage"; // <-- Descomenta si exportas TemporaryOrderItem

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const { category } = req.query;
      let products;

      if (category && typeof category === "string" && category !== "all") {
        const categoryId = parseInt(category);
        if (!isNaN(categoryId)) {
          products = await storage.getProductsByCategory(categoryId);
        } else {
          products = await storage.getProducts();
        }
      } else {
        products = await storage.getProducts();
      }

      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Cart routes (protected)
  app.get("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        userId,
      });

      const cartItem = await storage.addToCart(cartItemData);
      res.json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid cart item data", errors: error.errors });
      }
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.put("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;

      if (isNaN(id) || typeof quantity !== "number" || quantity < 1) {
        return res.status(400).json({ message: "Invalid data" });
      }

      const updatedItem = await storage.updateCartItem(id, quantity);
      if (!updatedItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }

      await storage.removeFromCart(id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  app.delete("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.clearCart(userId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Orders routes (protected)
  app.get("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { paymentMethod, deliveryAddress } = req.body;

      // Get cart items
      const cartItems = await storage.getCartItems(userId);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Calculate total
      const subtotal = cartItems.reduce(
        (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
        0,
      );
      const delivery = 3.99;
      const total = subtotal + delivery;

      // Create order data (for the main order record)
      const orderData = {
        userId,
        status: "pending" as const, // Drizzle type assertion
        total: total.toFixed(2), // Formatear a 2 decimales para el tipo decimal
        paymentMethod,
        deliveryAddress,
      };

      // Prepare order items data WITHOUT orderId (it will be added by storage.createOrder)
      const orderItemsData = cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
        // No orderId here, as storage.createOrder will add it
      }));

      // Call createOrder, which will handle the insertion of both order and order items
      // The `storage.createOrder` is now updated to expect `TemporaryOrderItem[]`
      const order = await storage.createOrder(orderData, orderItemsData);

      // Clear cart
      await storage.clearCart(userId);

      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Contact routes
  app.post("/api/contact", async (req, res) => {
    try {
      const messageData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(messageData);

      // Here you would typically send an email
      // For now, we'll just store the message in the database

      res.json({ message: "Message sent successfully", id: message.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error sending contact message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Initialize sample data if needed
  app.post("/api/init-data", async (req, res) => {
    try {
      // Check if categories exist
      const existingCategories = await storage.getCategories();
      if (existingCategories.length === 0) {
        // Create categories
        const fruitsCategory = await storage.createCategory({
          name: "Fruits",
          slug: "fruits",
        });

        const vegetablesCategory = await storage.createCategory({
          name: "Vegetables",
          slug: "vegetables",
        });

        // Create sample products
        const sampleProducts = [
          // Fruits
          {
            name: "Red Apples",
            description:
              "Sweet and crispy organic apples, perfect for snacking",
            price: "3.99",
            unit: "kg",
            imageUrl:
              "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: fruitsCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Bananas",
            description: "Naturally sweet and potassium-rich bananas",
            price: "2.49",
            unit: "kg",
            imageUrl:
              "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: fruitsCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Oranges",
            description: "Juicy Valencia oranges packed with vitamin C",
            price: "4.29",
            unit: "kg",
            imageUrl:
              "https://images.unsplash.com/photo-1547514701-42782101795e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: fruitsCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Strawberries",
            description: "Sweet and aromatic strawberries, locally grown",
            price: "6.99",
            unit: "kg",
            imageUrl:
              "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: fruitsCategory.id,
            isOrganic: true,
            inStock: true,
          },
          // Vegetables
          {
            name: "Tomatoes",
            description: "Vine-ripened tomatoes bursting with flavor",
            price: "5.49",
            unit: "kg",
            imageUrl:
              "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: vegetablesCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Lettuce",
            description: "Crisp and fresh iceberg lettuce for salads",
            price: "2.99",
            unit: "head",
            imageUrl:
              "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: vegetablesCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Carrots",
            description: "Sweet and crunchy carrots rich in beta-carotene",
            price: "3.49",
            unit: "kg",
            imageUrl:
              "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: vegetablesCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Broccoli",
            description: "Nutritious green broccoli packed with vitamins",
            price: "4.99",
            unit: "kg",
            imageUrl:
              "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: vegetablesCategory.id,
            isOrganic: true,
            inStock: true,
          },
        ];

        for (const productData of sampleProducts) {
          await storage.createProduct(productData);
        }
      }

      res.json({ message: "Sample data initialized" });
    } catch (error) {
      console.error("Error initializing data:", error);
      res.status(500).json({ message: "Failed to initialize data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

*/
////////////////////////////////////////////////////
////////////////////////////////////////////////////

/*
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertContactMessageSchema, insertCartItemSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Categories routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Products routes
  app.get('/api/products', async (req, res) => {
    try {
      const { category } = req.query;
      let products;
      
      if (category && typeof category === 'string' && category !== 'all') {
        const categoryId = parseInt(category);
        if (!isNaN(categoryId)) {
          products = await storage.getProductsByCategory(categoryId);
        } else {
          products = await storage.getProducts();
        }
      } else {
        products = await storage.getProducts();
      }
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Cart routes (protected)
  app.get('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        userId,
      });

      const cartItem = await storage.addToCart(cartItemData);
      res.json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cart item data", errors: error.errors });
      }
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.put('/api/cart/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;

      if (isNaN(id) || typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ message: "Invalid data" });
      }

      const updatedItem = await storage.updateCartItem(id, quantity);
      if (!updatedItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete('/api/cart/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }

      await storage.removeFromCart(id);
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  app.delete('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.clearCart(userId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Orders routes (protected)
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { paymentMethod, deliveryAddress } = req.body;

      // Get cart items
      const cartItems = await storage.getCartItems(userId);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Calculate total
      const subtotal = cartItems.reduce((sum, item) => 
        sum + (parseFloat(item.product.price) * item.quantity), 0
      );
      const delivery = 3.99;
      const total = subtotal + delivery;

      // Create order
      const orderData = {
        userId,
        status: "pending" as const,
        total: total.toString(),
        paymentMethod,
        deliveryAddress,
      };

      const orderItemsData = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const order = await storage.createOrder(orderData, orderItemsData);

      // Clear cart
      await storage.clearCart(userId);

      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Contact routes
  app.post('/api/contact', async (req, res) => {
    try {
      const messageData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(messageData);
      
      // Here you would typically send an email
      // For now, we'll just store the message in the database
      
      res.json({ message: "Message sent successfully", id: message.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error sending contact message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Initialize sample data if needed
  app.post('/api/init-data', async (req, res) => {
    try {
      // Check if categories exist
      const existingCategories = await storage.getCategories();
      if (existingCategories.length === 0) {
        // Create categories
        const fruitsCategory = await storage.createCategory({
          name: "Fruits",
          slug: "fruits",
        });

        const vegetablesCategory = await storage.createCategory({
          name: "Vegetables",
          slug: "vegetables",
        });

        // Create sample products
        const sampleProducts = [
          // Fruits
          {
            name: "Red Apples",
            description: "Sweet and crispy organic apples, perfect for snacking",
            price: "3.99",
            unit: "kg",
            imageUrl: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: fruitsCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Bananas",
            description: "Naturally sweet and potassium-rich bananas",
            price: "2.49",
            unit: "kg",
            imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: fruitsCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Oranges",
            description: "Juicy Valencia oranges packed with vitamin C",
            price: "4.29",
            unit: "kg",
            imageUrl: "https://images.unsplash.com/photo-1547514701-42782101795e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: fruitsCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Strawberries",
            description: "Sweet and aromatic strawberries, locally grown",
            price: "6.99",
            unit: "kg",
            imageUrl: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: fruitsCategory.id,
            isOrganic: true,
            inStock: true,
          },
          // Vegetables
          {
            name: "Tomatoes",
            description: "Vine-ripened tomatoes bursting with flavor",
            price: "5.49",
            unit: "kg",
            imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: vegetablesCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Lettuce",
            description: "Crisp and fresh iceberg lettuce for salads",
            price: "2.99",
            unit: "head",
            imageUrl: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: vegetablesCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Carrots",
            description: "Sweet and crunchy carrots rich in beta-carotene",
            price: "3.49",
            unit: "kg",
            imageUrl: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: vegetablesCategory.id,
            isOrganic: true,
            inStock: true,
          },
          {
            name: "Broccoli",
            description: "Nutritious green broccoli packed with vitamins",
            price: "4.99",
            unit: "kg",
            imageUrl: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
            categoryId: vegetablesCategory.id,
            isOrganic: true,
            inStock: true,
          },
        ];

        for (const productData of sampleProducts) {
          await storage.createProduct(productData);
        }
      }

      res.json({ message: "Sample data initialized" });
    } catch (error) {
      console.error("Error initializing data:", error);
      res.status(500).json({ message: "Failed to initialize data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
*/
