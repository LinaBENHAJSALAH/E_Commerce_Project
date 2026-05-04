import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../common/product';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list-grid.component.html',
  styleUrls: ['./product-list.component.css']
})

export class ProductListComponent implements OnInit {
  products: Product[] = [];
  constructor(
    private productService: ProductService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.listProducts();
  }

  listProducts() {
    this.productService.getProducts().subscribe(
      data => {
        this.products = data;
      }
    )
  }

  /** Add a product to the shopping cart */
  addToCart(product: Product): void {
    this.cartService.addToCart(product);
  }

}