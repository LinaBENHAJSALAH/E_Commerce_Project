import { Component } from '@angular/core';
import { CartService } from './services/cart.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'angular-ecommerce';

  // Expose cart observables for the navbar badge
  totalPrice$: Observable<number>;
  totalQuantity$: Observable<number>;

  constructor(private cartService: CartService) {
    this.totalPrice$ = this.cartService.totalPrice$;
    this.totalQuantity$ = this.cartService.totalQuantity$;
  }
}

