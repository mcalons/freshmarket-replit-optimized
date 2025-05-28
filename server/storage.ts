// server/storage.ts

import {
  users,
  products,
  categories,
  cartItems,
  orders,
  orderItems,
  contactMessages,
  type User,
  type UpsertUser,
  type Product,
  type Category,
  type CartItem,
  type Order,
  type OrderItem,
  type ContactMessage,
  type InsertProduct,
  type InsertCategory,
  type InsertCartItem,
  type InsertOrder,
  type InsertOrderItem,
  type InsertContactMessage,
  type UserId,
  type NumericId,
  parseUserId,
  parseNumericId,
} from "@shared/schema";
import { db } from "./db.js";
import { eq, and, desc } from "drizzle-orm";

// Nuevo tipo para los ítems de la orden antes de que se les asigne el orderId.
// Esto refleja lo que viene del frontend/carrito, donde orderId aún no existe.
export type TemporaryOrderItem = Omit<InsertOrderItem, "orderId">;

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: UserId): Promise<User | null>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Product operations
  getProducts(): Promise<(Product & { category: Category })[]>;
  getProductsByCategory(
    categoryId: NumericId,
  ): Promise<(Product & { category: Category })[]>;
  getProduct(id: NumericId): Promise<(Product & { category: Category }) | null>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Cart operations
  getCartItems(
    userId: UserId,
  ): Promise<(CartItem & { product: Product & { category: Category } })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: NumericId, quantity: number): Promise<CartItem | null>;
  removeFromCart(id: NumericId): Promise<void>;
  clearCart(userId: UserId): Promise<void>;

  // Order operations
  // createOrder ahora acepta TemporaryOrderItem[]
  createOrder(order: InsertOrder, items: TemporaryOrderItem[]): Promise<Order>;
  getUserOrders(
    userId: UserId,
  ): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]>;
  // getOrder devuelve `null` para consistencia con la interfaz
  getOrder(
    id: NumericId,
  ): Promise<
    (Order & { orderItems: (OrderItem & { product: Product })[] }) | null
  >;

  // Contact operations
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: UserId): Promise<User | null> {
    const validId = parseUserId(id);
    if (!validId) return null;

    const [user] = await db.select().from(users).where(eq(users.id, validId));
    return user || null;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!user) {
      throw new Error("Failed to upsert user");
    }
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  // Product operations
  async getProducts(): Promise<(Product & { category: Category })[]> {
    return await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .then((rows) =>
        rows.map((row) => ({
          ...row.products,
          category: row.categories!,
        })),
      );
  }

  async getProductsByCategory(
    categoryId: NumericId,
  ): Promise<(Product & { category: Category })[]> {
    const validId = parseNumericId(categoryId);
    if (!validId) return [];

    return await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.categoryId, validId))
      .then((rows) =>
        rows.map((row) => ({
          ...row.products,
          category: row.categories!,
        })),
      );
  }

  async getProduct(
    id: NumericId,
  ): Promise<(Product & { category: Category }) | null> {
    const validId = parseNumericId(id);
    if (!validId) return null;

    const [result] = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, validId));

    if (!result) return null;

    return {
      ...result.products,
      category: result.categories!,
    };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  // Cart operations
  async getCartItems(
    userId: UserId,
  ): Promise<(CartItem & { product: Product & { category: Category } })[]> {
    const validUserId = parseUserId(userId);
    if (!validUserId) return [];

    return await db
      .select()
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(cartItems.userId, validUserId))
      .then((rows) =>
        rows.map((row) => ({
          ...row.cart_items,
          product: {
            ...row.products!,
            category: row.categories!,
          },
        })),
      );
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, cartItem.userId),
          eq(cartItems.productId, cartItem.productId),
        ),
      );

    if (existingItem) {
      // Update quantity - handle potential undefined values safely
      const currentQuantity = existingItem.quantity ?? 0;
      // Aseguramos que `addQuantity` es un número, por si acaso `cartItem.quantity`
      // es opcional o puede ser `undefined` en el tipo `InsertCartItem`.
      const addQuantity = cartItem.quantity ?? 0; // <--- CORRECCIÓN AQUÍ

      const [updatedItem] = await db
        .update(cartItems)
        .set({
          quantity: currentQuantity + addQuantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();

      if (!updatedItem) {
        throw new Error("Failed to update cart item");
      }
      return updatedItem;
    } else {
      // Create new cart item
      const [newItem] = await db.insert(cartItems).values(cartItem).returning();
      return newItem;
    }
  }

  async updateCartItem(
    id: NumericId,
    quantity: number,
  ): Promise<CartItem | null> {
    const validId = parseNumericId(id);
    if (!validId) return null;

    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, validId))
      .returning();
    return updatedItem || null;
  }

  async removeFromCart(id: NumericId): Promise<void> {
    const validId = parseNumericId(id);
    if (!validId) return;

    await db.delete(cartItems).where(eq(cartItems.id, validId));
  }

  async clearCart(userId: UserId): Promise<void> {
    const validUserId = parseUserId(userId);
    if (!validUserId) return;

    await db.delete(cartItems).where(eq(cartItems.userId, validUserId));
  }

  // Order operations
  // La implementación de createOrder ahora usa TemporaryOrderItem[] para `items`
  async createOrder(
    order: InsertOrder,
    items: TemporaryOrderItem[],
  ): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(orders).values(order).returning();

      // Comprobación de seguridad para asegurarse de que newOrder y newOrder.id existen
      if (!newOrder || typeof newOrder.id === "undefined") {
        throw new Error("Failed to create order header, missing ID.");
      }

      // Mapear los ítems del carrito para incluir el orderId recién generado
      const orderItemsWithOrderId: InsertOrderItem[] = items.map((item) => ({
        ...item,
        orderId: newOrder.id, // Aquí es donde se asigna el orderId
      }));

      // Solo insertar si hay ítems para evitar errores de Drizzle con arrays vacíos
      if (orderItemsWithOrderId.length > 0) {
        await tx.insert(orderItems).values(orderItemsWithOrderId);
      }

      return newOrder;
    });
  }

  async getUserOrders(
    userId: string,
  ): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]> {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          orderItems: items.map((item) => ({
            ...item.order_items,
            product: item.products!,
          })),
        };
      }),
    );

    return ordersWithItems;
  }

  // **CORRECCIÓN PARA EL ERROR TS2416**
  // La interfaz IStorage espera `null` para `getOrder`, y la implementación debe devolver `null`.
  async getOrder(
    id: NumericId,
  ): Promise<
    (Order & { orderItems: (OrderItem & { product: Product })[] }) | null
  > {
    const validId = parseNumericId(id);
    if (!validId) return null; // Convertir undefined a null para consistencia

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, validId)); // Usar validId

    // Si no se encuentra la orden, devuelve null como lo espera la interfaz
    if (!order) return null;

    const items = await db
      .select()
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, validId)); // Usar validId

    return {
      ...order,
      orderItems: items.map((item) => ({
        ...item.order_items,
        product: item.products!,
      })),
    };
  }

  // Contact operations
  async createContactMessage(
    message: InsertContactMessage,
  ): Promise<ContactMessage> {
    const [newMessage] = await db
      .insert(contactMessages)
      .values(message)
      .returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();

/*
import {
  users,
  products,
  categories,
  cartItems,
  orders,
  orderItems,
  contactMessages,
  type User,
  type UpsertUser,
  type Product,
  type Category,
  type CartItem,
  type Order,
  type OrderItem,
  type ContactMessage,
  type InsertProduct,
  type InsertCategory,
  type InsertCartItem,
  type InsertOrder,
  type InsertOrderItem,
  type InsertContactMessage,
  type UserId,
  type NumericId,
  parseUserId,
  parseNumericId,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: UserId): Promise<User | null>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Product operations
  getProducts(): Promise<(Product & { category: Category })[]>;
  getProductsByCategory(categoryId: NumericId): Promise<(Product & { category: Category })[]>;
  getProduct(id: NumericId): Promise<(Product & { category: Category }) | null>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Cart operations
  getCartItems(userId: UserId): Promise<(CartItem & { product: Product & { category: Category } })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: NumericId, quantity: number): Promise<CartItem | null>;
  removeFromCart(id: NumericId): Promise<void>;
  clearCart(userId: UserId): Promise<void>;

  // Order operations
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getUserOrders(userId: UserId): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]>;
  getOrder(id: NumericId): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | null>;

  // Contact operations
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: UserId): Promise<User | null> {
    const validId = parseUserId(id);
    if (!validId) return null;
    
    const [user] = await db.select().from(users).where(eq(users.id, validId));
    return user || null;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    if (!user) {
      throw new Error('Failed to upsert user');
    }
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  // Product operations
  async getProducts(): Promise<(Product & { category: Category })[]> {
    return await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .then(rows => 
        rows.map(row => ({
          ...row.products,
          category: row.categories!,
        }))
      );
  }

  async getProductsByCategory(categoryId: NumericId): Promise<(Product & { category: Category })[]> {
    const validId = parseNumericId(categoryId);
    if (!validId) return [];
    
    return await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.categoryId, validId))
      .then(rows => 
        rows.map(row => ({
          ...row.products,
          category: row.categories!,
        }))
      );
  }

  async getProduct(id: NumericId): Promise<(Product & { category: Category }) | null> {
    const validId = parseNumericId(id);
    if (!validId) return null;
    
    const [result] = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, validId));
    
    if (!result) return null;
    
    return {
      ...result.products,
      category: result.categories!,
    };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  // Cart operations
  async getCartItems(userId: UserId): Promise<(CartItem & { product: Product & { category: Category } })[]> {
    const validUserId = parseUserId(userId);
    if (!validUserId) return [];
    
    return await db
      .select()
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(cartItems.userId, validUserId))
      .then(rows =>
        rows.map(row => ({
          ...row.cart_items,
          product: {
            ...row.products!,
            category: row.categories!,
          },
        }))
      );
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, cartItem.userId),
          eq(cartItems.productId, cartItem.productId)
        )
      );

    if (existingItem) {
      // Update quantity - handle potential undefined values safely
      const currentQuantity = existingItem.quantity ?? 0;
      const addQuantity = cartItem.quantity;
      
      const [updatedItem] = await db
        .update(cartItems)
        .set({
          quantity: currentQuantity + addQuantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      
      if (!updatedItem) {
        throw new Error('Failed to update cart item');
      }
      return updatedItem;
    } else {
      // Create new cart item
      const [newItem] = await db.insert(cartItems).values(cartItem).returning();
      return newItem;
    }
  }

  async updateCartItem(id: NumericId, quantity: number): Promise<CartItem | null> {
    const validId = parseNumericId(id);
    if (!validId) return null;
    
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, validId))
      .returning();
    return updatedItem || null;
  }

  async removeFromCart(id: NumericId): Promise<void> {
    const validId = parseNumericId(id);
    if (!validId) return;
    
    await db.delete(cartItems).where(eq(cartItems.id, validId));
  }

  async clearCart(userId: UserId): Promise<void> {
    const validUserId = parseUserId(userId);
    if (!validUserId) return;
    
    await db.delete(cartItems).where(eq(cartItems.userId, validUserId));
  }

  // Order operations
  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(orders).values(order).returning();
      
      const orderItemsWithOrderId = items.map(item => ({
        ...item,
        orderId: newOrder.id,
      }));
      
      await tx.insert(orderItems).values(orderItemsWithOrderId);
      
      return newOrder;
    });
  }

  async getUserOrders(userId: string): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]> {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          orderItems: items.map(item => ({
            ...item.order_items,
            product: item.products!,
          })),
        };
      })
    );

    return ordersWithItems;
  }

  async getOrder(id: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    
    if (!order) return undefined;

    const items = await db
      .select()
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));

    return {
      ...order,
      orderItems: items.map(item => ({
        ...item.order_items,
        product: item.products!,
      })),
    };
  }

  // Contact operations
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [newMessage] = await db.insert(contactMessages).values(message).returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();
*/
