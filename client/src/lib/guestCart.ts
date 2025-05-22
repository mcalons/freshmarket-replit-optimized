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