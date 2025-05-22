export function calculateCartTotal(items: any[]) {
  const subtotal = items.reduce((sum, item) => 
    sum + (parseFloat(item.product.price) * item.quantity), 0
  );
  const delivery = 3.99;
  const total = subtotal + delivery;
  
  return {
    subtotal: subtotal.toFixed(2),
    delivery: delivery.toFixed(2),
    total: total.toFixed(2),
  };
}

export function getCartItemCount(items: any[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
