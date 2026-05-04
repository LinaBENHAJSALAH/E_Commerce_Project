import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Payload for creating an order on the backend.
 */
export interface OrderRequest {
  customerName: string;
  customerEmail: string;
  walletAddress: string;
  totalPrice: number;
  transactionHash: string;
  items: OrderItemDTO[];
}

export interface OrderItemDTO {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string;
}

export interface OrderResponse {
  orderId: number;
  status: string;
  message: string;
}

/**
 * OrderService handles HTTP communication with the Spring Boot backend
 * for order creation and history retrieval.
 */
@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private baseUrl = 'http://localhost:8080/api/orders';

  constructor(private http: HttpClient) { }

  /**
   * Submit a new order to the backend.
   * The backend will validate the transaction hash for fraud protection.
   */
  createOrder(order: OrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.baseUrl, order);
  }

  /**
   * Retrieve order history for a given email address.
   */
  getOrderHistory(email: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/history/${email}`);
  }
}
