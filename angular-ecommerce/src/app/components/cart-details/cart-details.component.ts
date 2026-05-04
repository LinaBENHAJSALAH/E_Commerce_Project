import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../common/cart-item';

/**
 * CartDetailsComponent displays the shopping cart contents.
 * Users can update quantities, remove items, and proceed to checkout.
 */
@Component({
  selector: 'app-cart-details',
  templateUrl: './cart-details.component.html',
  styleUrls: ['./cart-details.component.css']
})
export class CartDetailsComponent implements OnInit, OnDestroy {

  cartItems: CartItem[] = [];
  totalPrice: number = 0;
  totalQuantity: number = 0;

  private subscriptions: Subscription[] = [];

  constructor(
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Subscribe to cart state changes
    this.subscriptions.push(
      this.cartService.cartItems$.subscribe(items => {
        this.cartItems = items;
      }),
      this.cartService.totalPrice$.subscribe(price => {
        this.totalPrice = price;
      }),
      this.cartService.totalQuantity$.subscribe(qty => {
        this.totalQuantity = qty;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /** Increment item quantity by 1 */
  incrementQuantity(item: CartItem): void {
    this.cartService.incrementQuantity(item);
  }

  /** Decrement item quantity by 1 (removes if reaches 0) */
  decrementQuantity(item: CartItem): void {
    this.cartService.decrementQuantity(item);
  }

  /** Remove item from cart entirely */
  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item);
  }

  /** Clear the entire cart */
  clearCart(): void {
    this.cartService.clearCart();
  }

  /** Navigate to checkout page */
  proceedToCheckout(): void {
    this.router.navigate(['/checkout']);
  }
}
