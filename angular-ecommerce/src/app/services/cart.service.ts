import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartItem } from '../common/cart-item';
import { Product } from '../common/product';

/**
 * CartService manages the shopping cart state using RxJS BehaviorSubject.
 * Cart items are persisted to localStorage so they survive page refreshes.
 */
@Injectable({
  providedIn: 'root'
})
export class CartService {

  private readonly STORAGE_KEY = 'ecommerce_cart';

  // --- Reactive state ---
  private cartItemsSubject = new BehaviorSubject<CartItem[]>(this.loadFromStorage());
  cartItems$ = this.cartItemsSubject.asObservable();

  /** Total price of all items in the cart */
  totalPrice$: Observable<number> = this.cartItems$.pipe(
    map(items => items.reduce((sum, item) => sum + item.subTotal, 0))
  );

  /** Total number of items (sum of all quantities) */
  totalQuantity$: Observable<number> = this.cartItems$.pipe(
    map(items => items.reduce((sum, item) => sum + item.quantity, 0))
  );

  constructor() { }

  /**
   * Add a product to the cart.
   * If the product already exists, increment its quantity.
   */
  addToCart(product: Product): void {
    const currentItems = this.cartItemsSubject.value;
    const existingItem = currentItems.find(item => item.id === product.sku);

    if (existingItem) {
      // Product already in cart — increment quantity
      existingItem.quantity++;
    } else {
      // New product — add to cart
      currentItems.push(new CartItem(product));
    }

    this.updateCart(currentItems);
  }

  /**
   * Remove an item from the cart entirely.
   */
  removeFromCart(cartItem: CartItem): void {
    const currentItems = this.cartItemsSubject.value;
    const filtered = currentItems.filter(item => item.id !== cartItem.id);
    this.updateCart(filtered);
  }

  /**
   * Update the quantity of a specific cart item.
   * If quantity drops to 0 or below, the item is removed.
   */
  updateQuantity(cartItem: CartItem, newQuantity: number): void {
    const currentItems = this.cartItemsSubject.value;
    const target = currentItems.find(item => item.id === cartItem.id);

    if (target) {
      if (newQuantity <= 0) {
        // Remove the item if quantity is zero or negative
        this.removeFromCart(cartItem);
        return;
      }
      target.quantity = newQuantity;
    }

    this.updateCart(currentItems);
  }

  /**
   * Increment the quantity of a cart item by 1.
   */
  incrementQuantity(cartItem: CartItem): void {
    this.updateQuantity(cartItem, cartItem.quantity + 1);
  }

  /**
   * Decrement the quantity of a cart item by 1.
   * Removes the item if quantity reaches 0.
   */
  decrementQuantity(cartItem: CartItem): void {
    this.updateQuantity(cartItem, cartItem.quantity - 1);
  }

  /**
   * Clear all items from the cart.
   */
  clearCart(): void {
    this.updateCart([]);
  }

  /**
   * Get the current cart items snapshot (non-reactive).
   * Useful for building order payloads.
   */
  getCartItems(): CartItem[] {
    return [...this.cartItemsSubject.value];
  }

  // --- Private helpers ---

  /** Emit new state and persist to localStorage */
  private updateCart(items: CartItem[]): void {
    this.cartItemsSubject.next(items);
    this.saveToStorage(items);
  }

  /** Save cart items to localStorage as JSON */
  private saveToStorage(items: CartItem[]): void {
    try {
      const data = items.map(item => ({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        unitPrice: item.unitPrice,
        quantity: item.quantity
      }));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('CartService: Failed to save cart to localStorage', e);
    }
  }

  /** Load cart items from localStorage on service initialization */
  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw) as Array<{
        id: string;
        name: string;
        imageUrl: string;
        unitPrice: number;
        quantity: number;
      }>;

      // Reconstruct CartItem instances from plain objects
      return parsed.map(obj => {
        const item = new CartItem(
          { sku: obj.id, name: obj.name, imageUrl: obj.imageUrl, unitPrice: obj.unitPrice } as Product,
          obj.quantity
        );
        return item;
      });
    } catch (e) {
      console.warn('CartService: Failed to load cart from localStorage', e);
      return [];
    }
  }
}
