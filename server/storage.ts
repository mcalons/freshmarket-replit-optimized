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
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
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

  async getProductsByCategory(categoryId: number): Promise<(Product & { category: Category })[]> {
    return await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.categoryId, categoryId))
      .then(rows => 
        rows.map(row => ({
          ...row.products,
          category: row.categories!,
        }))
      );
  }

  async getProduct(id: number): Promise<(Product & { category: Category }) | undefined> {
    const [result] = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id));
    
    if (!result) return undefined;
    
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
  async getCartItems(userId: string): Promise<(CartItem & { product: Product & { category: Category } })[]> {
    return await db
      .select()
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(cartItems.userId, userId))
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
      // Update quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({
          quantity: existingItem.quantity + cartItem.quantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Create new cart item
      const [newItem] = await db.insert(cartItems).values(cartItem).returning();
      return newItem;
    }
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
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
