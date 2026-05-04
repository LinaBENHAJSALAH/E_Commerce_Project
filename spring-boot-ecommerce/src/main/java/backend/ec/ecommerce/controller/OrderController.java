package backend.ec.ecommerce.controller;

import backend.ec.ecommerce.Entity.Order;
import backend.ec.ecommerce.dto.OrderRequest;
import backend.ec.ecommerce.dto.OrderResponse;
import backend.ec.ecommerce.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for order management.
 *
 * Endpoints:
 * - POST /api/orders       → Create a new order (with fraud protection)
 * - GET  /api/orders/history/{email} → Get order history for a customer
 */
@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:4200")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Create a new order.
     * The OrderService will run fraud protection checks before persisting.
     */
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody OrderRequest request) {
        OrderResponse response = orderService.createOrder(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Get order history for a customer identified by email.
     */
    @GetMapping("/history/{email}")
    public ResponseEntity<List<Order>> getOrderHistory(@PathVariable String email) {
        List<Order> orders = orderService.getOrderHistory(email);
        return ResponseEntity.ok(orders);
    }
}
