import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { CryptoService } from '../../services/crypto.service';
import { OrderService, OrderRequest } from '../../services/order.service';
import { CartItem } from '../../common/cart-item';

/**
 * CheckoutComponent orchestrates the entire payment flow:
 * 1. Display order summary from the cart
 * 2. Collect customer info (name, email)
 * 3. Connect MetaMask wallet
 * 4. Send crypto payment
 * 5. Submit order to backend with transaction hash
 */
@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {

  // Cart state
  cartItems: CartItem[] = [];
  totalPrice: number = 0;

  // Customer info
  customerName: string = '';
  customerEmail: string = '';

  // Wallet state
  walletAddress: string = '';
  walletBalance: string = '';
  isMetaMaskInstalled: boolean = false;
  isWalletConnected: boolean = false;

  // Payment state
  ethAmount: string = '';
  ethUsdRate: number = 0;
  transactionHash: string = '';
  isProcessing: boolean = false;
  isOrderSubmitted: boolean = false;

  // UI state
  errorMessage: string = '';
  successMessage: string = '';
  currentStep: number = 1; // 1=Review, 2=Connect, 3=Pay, 4=Done

  private subscriptions: Subscription[] = [];

  constructor(
    private cartService: CartService,
    private cryptoService: CryptoService,
    private orderService: OrderService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Load cart data
    this.subscriptions.push(
      this.cartService.cartItems$.subscribe(items => {
        this.cartItems = items;
      }),
      this.cartService.totalPrice$.subscribe(price => {
        this.totalPrice = price;
        this.ethAmount = this.cryptoService.convertUsdToEth(price);
      })
    );

    // Check MetaMask availability
    this.isMetaMaskInstalled = this.cryptoService.isMetaMaskInstalled();
    this.ethUsdRate = this.cryptoService.getEthUsdRate();

    // Redirect to cart if empty
    if (this.cartItems.length === 0) {
      this.router.navigate(['/cart']);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Step 1 → Step 2: Validate customer info and proceed to wallet connection.
   */
  proceedToConnect(): void {
    this.clearMessages();

    if (!this.customerName.trim() || !this.customerEmail.trim()) {
      this.errorMessage = 'Please enter your name and email address.';
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.customerEmail)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    this.currentStep = 2;
  }

  /**
   * Step 2: Connect MetaMask wallet.
   */
  async connectWallet(): Promise<void> {
    this.clearMessages();
    this.isProcessing = true;

    try {
      this.walletAddress = await this.cryptoService.connectWallet();
      this.walletBalance = await this.cryptoService.getBalance();
      this.isWalletConnected = true;
      this.currentStep = 3;
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Step 3: Send the crypto payment via MetaMask.
   */
  async payWithCrypto(): Promise<void> {
    this.clearMessages();
    this.isProcessing = true;

    try {
      // Send the ETH transaction
      this.transactionHash = await this.cryptoService.sendPayment(this.totalPrice);
      this.successMessage = 'Payment successful! Submitting order...';

      // Submit the order to the backend
      await this.submitOrder();

      this.currentStep = 4;
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Submit the order to the Spring Boot backend with the transaction hash.
   */
  private async submitOrder(): Promise<void> {
    const orderRequest: OrderRequest = {
      customerName: this.customerName.trim(),
      customerEmail: this.customerEmail.trim(),
      walletAddress: this.walletAddress,
      totalPrice: this.totalPrice,
      transactionHash: this.transactionHash,
      items: this.cartItems.map(item => ({
        productId: item.id,
        productName: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        imageUrl: item.imageUrl
      }))
    };

    return new Promise<void>((resolve, reject) => {
      this.orderService.createOrder(orderRequest).subscribe({
        next: (response) => {
          this.isOrderSubmitted = true;
          this.successMessage = `Order #${response.orderId} confirmed! Payment verified.`;
          // Clear the cart after successful order
          this.cartService.clearCart();
          resolve();
        },
        error: (err) => {
          // Even if backend fails, the payment was made — show both
          const backendMsg = err.error?.message || 'Failed to save order on server.';
          this.errorMessage = `Payment sent, but order submission failed: ${backendMsg}`;
          this.isOrderSubmitted = false;
          resolve(); // Don't reject — we still want to show the TX hash
        }
      });
    });
  }

  /**
   * Navigate back to the products page after a successful order.
   */
  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  /**
   * Shorten wallet/tx hash for display (0x1234...abcd).
   */
  shortenAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
