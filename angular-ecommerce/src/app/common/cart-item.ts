import { Product } from './product';

/**
 * CartItem wraps a Product with a quantity.
 * Used by CartService to manage the shopping cart state.
 */
export class CartItem {
  id: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;

  constructor(product: Product, quantity: number = 1) {
    this.id = product.sku;           // Use SKU as unique identifier
    this.name = product.name;
    this.imageUrl = product.imageUrl;
    this.unitPrice = product.unitPrice;
    this.quantity = quantity;
  }

  /** Computed subtotal for this cart line */
  get subTotal(): number {
    return this.unitPrice * this.quantity;
  }
}
