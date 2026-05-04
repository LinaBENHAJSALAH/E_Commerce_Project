import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { CryptoService } from '../../services/crypto.service';
import { OrderService } from '../../services/order.service';
import { CartItem } from '../../common/cart-item';
import { Product } from '../../common/product';

/**
 * DemoComponent — a self-contained test/validation page for the entire
 * blockchain e-commerce flow. Uses mock products so it works without
 * the backend product catalog running.
 */
@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css']
})
export class DemoComponent implements OnInit, OnDestroy {

  // ── Mock Products ────────────────────────────────────────────────
  mockProducts: Product[] = [
    {
      sku: 'BOOK-001', name: 'Clean Code (Book)', description: 'A handbook of agile craftsmanship',
      unitPrice: 35.99, imageUrl: 'https://via.placeholder.com/80x80?text=Book',
      active: true, unitsInStock: 10, dateCreated: new Date(), lastUpdated: new Date()
    },
    {
      sku: 'MUG-001', name: 'Dev Coffee Mug', description: '11oz ceramic mug',
      unitPrice: 14.99, imageUrl: 'https://via.placeholder.com/80x80?text=Mug',
      active: true, unitsInStock: 5, dateCreated: new Date(), lastUpdated: new Date()
    },
    {
      sku: 'PAD-001', name: 'XL Mouse Pad', description: 'Extra-large desk mat',
      unitPrice: 24.99, imageUrl: 'https://via.placeholder.com/80x80?text=Pad',
      active: true, unitsInStock: 8, dateCreated: new Date(), lastUpdated: new Date()
    }
  ];

  // ── Cart State ───────────────────────────────────────────────────
  cartItems: CartItem[] = [];
  totalPrice: number = 0;
  totalQuantity: number = 0;
  localStorageContent: string = '';

  // ── Wallet State ─────────────────────────────────────────────────
  isMetaMaskInstalled: boolean = false;
  walletAddress: string = '';
  walletBalance: string = '';
  isWalletConnected: boolean = false;

  // ── Payment State ─────────────────────────────────────────────────
  transactionHash: string = '';
  paymentStatus: string = '';
  ethAmount: string = '';
  isProcessing: boolean = false;

  // ── Order State ───────────────────────────────────────────────────
  orderId: number | null = null;
  orderStatus: string = '';
  backendError: string = '';

  // ── Fraud Test State ──────────────────────────────────────────────
  fraudTestHash: string = '0xTEST_DUPLICATE_HASH_12345';
  fraudTestResult: string = '';
  fraudTestError: string = '';

  // ── Logs ──────────────────────────────────────────────────────────
  logs: Array<{ time: string; level: string; msg: string }> = [];

  private subs: Subscription[] = [];

  constructor(
    public cartService: CartService,
    public cryptoService: CryptoService,
    private orderService: OrderService
  ) { }

  ngOnInit(): void {
    this.subs.push(
      this.cartService.cartItems$.subscribe(items => {
        this.cartItems = items;
        this.refreshLocalStorageView();
      }),
      this.cartService.totalPrice$.subscribe(p => {
        this.totalPrice = p;
        this.ethAmount = this.cryptoService.convertUsdToEth(p);
      }),
      this.cartService.totalQuantity$.subscribe(q => this.totalQuantity = q)
    );
    this.isMetaMaskInstalled = this.cryptoService.isMetaMaskInstalled();
    this.log('info', 'Demo page loaded. MetaMask detected: ' + this.isMetaMaskInstalled);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  // ── CART ACTIONS ─────────────────────────────────────────────────

  addProduct(product: Product): void {
    this.cartService.addToCart(product);
    this.log('success', `Added to cart: ${product.name}`);
  }

  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item);
    this.log('warn', `Removed from cart: ${item.name}`);
  }

  increment(item: CartItem): void {
    this.cartService.incrementQuantity(item);
    this.log('info', `Incremented: ${item.name} → qty ${item.quantity + 1}`);
  }

  decrement(item: CartItem): void {
    this.cartService.decrementQuantity(item);
    this.log('info', `Decremented: ${item.name}`);
  }

  clearCart(): void {
    this.cartService.clearCart();
    this.log('warn', 'Cart cleared');
  }

  refreshLocalStorageView(): void {
    try {
      const raw = localStorage.getItem('ecommerce_cart');
      this.localStorageContent = raw ? JSON.stringify(JSON.parse(raw), null, 2) : 'empty';
    } catch { this.localStorageContent = 'error reading'; }
  }

  // ── WALLET ACTIONS ───────────────────────────────────────────────

  async connectWallet(): Promise<void> {
    this.log('info', 'Connecting MetaMask...');
    this.isProcessing = true;
    try {
      this.walletAddress = await this.cryptoService.connectWallet();
      this.walletBalance = await this.cryptoService.getBalance();
      this.isWalletConnected = true;
      this.log('success', `Wallet connected: ${this.walletAddress}`);
      this.log('info', `Balance: ${this.walletBalance} ETH`);
    } catch (e: any) {
      this.log('error', 'Wallet connect failed: ' + e.message);
    } finally {
      this.isProcessing = false;
    }
  }

  // ── PAYMENT ACTIONS ──────────────────────────────────────────────

  async payWithCrypto(): Promise<void> {
    if (!this.isWalletConnected) {
      this.log('error', 'Connect wallet first!'); return;
    }
    if (this.cartItems.length === 0) {
      this.log('error', 'Cart is empty!'); return;
    }
    this.isProcessing = true;
    this.paymentStatus = 'pending';
    this.log('info', `Sending ${this.ethAmount} ETH to contract...`);
    try {
      this.transactionHash = await this.cryptoService.sendPayment(this.totalPrice);
      this.paymentStatus = 'confirmed';
      this.log('success', 'TX confirmed: ' + this.transactionHash);
      await this.submitOrder();
    } catch (e: any) {
      this.paymentStatus = 'failed';
      this.log('error', 'Payment failed: ' + e.message);
    } finally {
      this.isProcessing = false;
    }
  }

  // ── ORDER ACTIONS ────────────────────────────────────────────────

  private async submitOrder(): Promise<void> {
    this.log('info', 'Submitting order to backend...');
    const payload = {
      customerName: 'Demo User',
      customerEmail: 'demo@test.com',
      walletAddress: this.walletAddress,
      totalPrice: this.totalPrice,
      transactionHash: this.transactionHash,
      items: this.cartItems.map(i => ({
        productId: i.id, productName: i.name,
        unitPrice: i.unitPrice, quantity: i.quantity, imageUrl: i.imageUrl
      }))
    };
    this.orderService.createOrder(payload).subscribe({
      next: (res) => {
        this.orderId = res.orderId;
        this.orderStatus = res.status;
        this.backendError = '';
        this.log('success', `Order #${res.orderId} saved — ${res.status}`);
        this.cartService.clearCart();
      },
      error: (err) => {
        this.backendError = err.error?.message || err.message;
        this.log('error', 'Backend error: ' + this.backendError);
      }
    });
  }

  // ── FRAUD TESTS ──────────────────────────────────────────────────

  testDuplicateHash(): void {
    this.log('info', 'Testing duplicate TX hash → expecting 400...');
    const payload = {
      customerName: 'Fraud Test', customerEmail: 'fraud@test.com',
      walletAddress: '0x0000000000000000000000000000000000000000',
      totalPrice: 35.99, transactionHash: this.fraudTestHash,
      items: [{ productId: 'BOOK-001', productName: 'Clean Code', unitPrice: 35.99, quantity: 1, imageUrl: '' }]
    };
    this.orderService.createOrder(payload).subscribe({
      next: (res) => {
        this.fraudTestResult = `First submission: Order #${res.orderId} created.`;
        this.log('success', this.fraudTestResult);
        // Submit again immediately to trigger duplicate check
        this.orderService.createOrder(payload).subscribe({
          next: () => this.log('warn', 'Duplicate NOT caught — check unique constraint!'),
          error: (err) => {
            this.fraudTestError = err.error?.message || err.message;
            this.log('success', 'Duplicate TX correctly rejected: ' + this.fraudTestError);
          }
        });
      },
      error: (err) => {
        this.fraudTestError = err.error?.message || err.message;
        this.log('warn', 'First submit failed (hash may already exist): ' + this.fraudTestError);
      }
    });
  }

  testWrongAmount(): void {
    this.log('info', 'Testing wrong amount → expecting 400...');
    const payload = {
      customerName: 'Fraud Test', customerEmail: 'fraud@test.com',
      walletAddress: '0x0000000000000000000000000000000000000000',
      totalPrice: 999.99, // Inflated total
      transactionHash: '0xFAKE_WRONG_AMOUNT_' + Date.now(),
      items: [{ productId: 'BOOK-001', productName: 'Clean Code', unitPrice: 35.99, quantity: 1, imageUrl: '' }]
    };
    this.orderService.createOrder(payload).subscribe({
      next: () => this.log('warn', 'Wrong amount NOT caught — check validation!'),
      error: (err) => {
        const msg = err.error?.message || err.message;
        this.log('success', 'Amount mismatch correctly rejected: ' + msg);
      }
    });
  }

  // ── HELPERS ──────────────────────────────────────────────────────

  log(level: string, msg: string): void {
    const time = new Date().toLocaleTimeString();
    this.logs.unshift({ time, level, msg });
    if (this.logs.length > 50) this.logs.pop();
  }

  clearLogs(): void { this.logs = []; }

  short(addr: string): string {
    if (!addr || addr.length < 10) return addr;
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
  }

  getEtherscanUrl(): string {
    return `https://sepolia.etherscan.io/tx/${this.transactionHash}`;
  }
}
