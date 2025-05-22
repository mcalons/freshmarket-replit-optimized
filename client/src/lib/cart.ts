export function calculateCartTotal(items: any[], isAuthenticated: boolean = false) {
  const subtotal = items.reduce((sum, item) => 
    sum + (parseFloat(item.product.price) * item.quantity), 0
  );
  
  // Registered users get 5% discount and free shipping over €60
  let discount = 0;
  let delivery = 3.99;
  
  if (isAuthenticated) {
    discount = subtotal * 0.05; // 5% discount for registered users
    if (subtotal >= 60) {
      delivery = 0; // Free shipping for orders over €60
    }
  }
  
  const discountedSubtotal = subtotal - discount;
  const total = discountedSubtotal + delivery;
  
  return {
    subtotal: subtotal.toFixed(2),
    discount: discount.toFixed(2),
    discountedSubtotal: discountedSubtotal.toFixed(2),
    delivery: delivery.toFixed(2),
    total: total.toFixed(2),
    hasDiscount: isAuthenticated && discount > 0,
    hasFreeShipping: isAuthenticated && subtotal >= 60,
  };
}

export function getCartItemCount(items: any[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
