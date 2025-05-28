// client/src/lib/guestCart.ts

// Importa los tipos necesarios desde @shared/schema
import {
  type CartItem as SchemaCartItem, // Renombrado para evitar conflicto
  type Product,
  type Category,
} from "@shared/schema";

// Definir PopulatedCartItem para que guestCart pueda trabajar con él.
// Hacemos que createdAt, updatedAt, userId sean opcionales o nullables
// para que GuestCartItem pueda ajustarse a esta interfaz.
export interface PopulatedCartItem {
  id: number;
  productId: number;
  quantity: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  userId: string | null; // Ahora forzamos que sea string | null para compatibilidad

  product: Product & { category: Category };
}

// La interfaz GuestCartItem se actualiza para ser compatible con PopulatedCartItem.

export interface GuestCartItem {
  id: number;
  productId: number;
  quantity: number;

  createdAt: Date | null;
  updatedAt: Date | null;
  userId: string | null;

  product: Product & { category: Category };
}

const GUEST_CART_KEY = "freshmarket_guest_cart";

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const cart = localStorage.getItem(GUEST_CART_KEY);
    const parsedCart: any[] = cart ? JSON.parse(cart) : [];

    return parsedCart.map((item) => ({
      id: item.productId,
      productId: item.productId,
      quantity: item.quantity,
      createdAt: item.createdAt || null,
      updatedAt: item.updatedAt || null,
      userId: item.userId || null,
      product: {
        // Asegúrate de que todas las propiedades de Product estén aquí,
        // incluso si son null o tienen valores por defecto para el guest cart.
        id: item.product.id,
        name: item.product.name,
        description: item.product.description || null, // <--- Añadido
        price: item.product.price,
        unit: item.product.unit,
        imageUrl: item.product.imageUrl || null,
        createdAt: item.product.createdAt || null, // <--- Añadido
        updatedAt: item.product.updatedAt || null, // <--- Añadido
        categoryId: item.product.categoryId || 0, // <--- Añadido (elige un valor por defecto si no existe)
        isOrganic: item.product.isOrganic || null, // <--- Añadido
        inStock: item.product.inStock || null, // <--- Añadido
        category: {
          id: item.product.category?.id || 0,
          name: item.product.category?.name || "Uncategorized",
          slug: item.product.category?.slug || "uncategorized",
          createdAt: item.product.category?.createdAt || null,
          updatedAt: item.product.category?.updatedAt || null,
        },
      },
    }));
  } catch {
    return [];
  }
}

export function saveGuestCart(items: GuestCartItem[]): void {
  if (typeof window === "undefined") return;

  try {
    // Al guardar, puedes guardar solo las propiedades relevantes para el almacenamiento local.
    // Aunque para mantener la compatibilidad, es más simple guardar todas.
    const rawItemsToSave = items.map((item) => ({
      id: item.productId,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        description: item.product.description, // Incluir
        price: item.product.price,
        unit: item.product.unit,
        imageUrl: item.product.imageUrl,
        createdAt: item.product.createdAt, // Incluir
        updatedAt: item.product.updatedAt, // Incluir
        categoryId: item.product.categoryId, // Incluir
        isOrganic: item.product.isOrganic, // Incluir
        inStock: item.product.inStock, // Incluir
        category: {
          name: item.product.category.name,
          id: item.product.category.id,
          slug: item.product.category.slug,
          createdAt: item.product.category.createdAt,
          updatedAt: item.product.category.updatedAt,
        },
      },
    }));
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(rawItemsToSave));
  } catch {
    // Ignore localStorage errors
  }
}

// product en addToGuestCart debe estar tipado como Product para acceso seguro
export function addToGuestCart(
  product: Product & { category: Category }, // product ya es el tipo correcto aquí
  quantity: number = 1,
): GuestCartItem[] {
  const cart = getGuestCart();
  const existingItemIndex = cart.findIndex(
    (item) => item.productId === product.id,
  );

  if (existingItemIndex >= 0) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    const newItem: GuestCartItem = {
      id: product.id,
      productId: product.id,
      quantity,
      createdAt: null, // Campos simulados
      updatedAt: null, // Campos simulados
      userId: null, // Campos simulados
      product: {
        // Asegúrate de que todas las propiedades de Product estén aquí también
        id: product.id,
        name: product.name,
        description: product.description || null, // <--- Añadido
        price: product.price,
        unit: product.unit,
        imageUrl: product.imageUrl,
        createdAt: product.createdAt || null, // <--- Añadido
        updatedAt: product.updatedAt || null, // <--- Añadido
        categoryId: product.categoryId, // <--- Añadido
        isOrganic: product.isOrganic || null, // <--- Añadido
        inStock: product.inStock || null, // <--- Añadido
        category: {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
          createdAt: product.category.createdAt,
          updatedAt: product.category.updatedAt,
        },
      },
    };
    cart.push(newItem);
  }

  saveGuestCart(cart);
  return cart;
}

// updateGuestCartItem ahora espera un productId numérico para consistencia
export function updateGuestCartItem(
  productId: number,
  quantity: number,
): GuestCartItem[] {
  const cart = getGuestCart();
  const itemIndex = cart.findIndex((item) => item.productId === productId); // Buscar por productId

  if (itemIndex >= 0) {
    if (quantity <= 0) {
      cart.splice(itemIndex, 1);
    } else {
      cart[itemIndex].quantity = quantity;
    }
  }

  saveGuestCart(cart);
  return cart;
}

// removeFromGuestCart ahora espera un productId numérico para consistencia
export function removeFromGuestCart(productId: number): GuestCartItem[] {
  const cart = getGuestCart().filter((item) => item.productId !== productId); // Filtrar por productId
  saveGuestCart(cart);
  return cart;
}

export function clearGuestCart(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // Ignore localStorage errors
  }
}

export function getGuestCartCount(): number {
  return getGuestCart().reduce((sum, item) => sum + item.quantity, 0);
}

/*
// Guest cart management using localStorage
interface GuestCartItem {
  id: string;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: string;
    unit: string;
    imageUrl: string;
    category: {
      name: string;
    };
  };
}

const GUEST_CART_KEY = 'freshmarket_guest_cart';

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const cart = localStorage.getItem(GUEST_CART_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
}

export function saveGuestCart(items: GuestCartItem[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    // Ignore localStorage errors
  }
}

export function addToGuestCart(product: any, quantity: number = 1): GuestCartItem[] {
  const cart = getGuestCart();
  const existingItemIndex = cart.findIndex(item => item.productId === product.id);
  
  if (existingItemIndex >= 0) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    const newItem: GuestCartItem = {
      id: `guest_${product.id}_${Date.now()}`,
      productId: product.id,
      quantity,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        imageUrl: product.imageUrl,
        category: product.category,
      },
    };
    cart.push(newItem);
  }
  
  saveGuestCart(cart);
  return cart;
}

export function updateGuestCartItem(itemId: string, quantity: number): GuestCartItem[] {
  const cart = getGuestCart();
  const itemIndex = cart.findIndex(item => item.id === itemId);
  
  if (itemIndex >= 0) {
    if (quantity <= 0) {
      cart.splice(itemIndex, 1);
    } else {
      cart[itemIndex].quantity = quantity;
    }
  }
  
  saveGuestCart(cart);
  return cart;
}

export function removeFromGuestCart(itemId: string): GuestCartItem[] {
  const cart = getGuestCart().filter(item => item.id !== itemId);
  saveGuestCart(cart);
  return cart;
}

export function clearGuestCart(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // Ignore localStorage errors
  }
}

export function getGuestCartCount(): number {
  return getGuestCart().reduce((sum, item) => sum + item.quantity, 0);
}
*/
