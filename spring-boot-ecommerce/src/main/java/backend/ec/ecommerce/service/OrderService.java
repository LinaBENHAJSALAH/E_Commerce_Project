package backend.ec.ecommerce.service;

import backend.ec.ecommerce.Entity.Order;
import backend.ec.ecommerce.Entity.OrderItem;
import backend.ec.ecommerce.Entity.OrderStatus;
import backend.ec.ecommerce.dao.OrderRepository;
import backend.ec.ecommerce.dto.OrderItemDTO;
import backend.ec.ecommerce.dto.OrderRequest;
import backend.ec.ecommerce.dto.OrderResponse;
import backend.ec.ecommerce.exception.FraudCheckException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * OrderService contains business logic for order creation and fraud protection.
 *
 * Fraud Protection Checks:
 * 1. Verify transaction hash is not reused (duplicate check)
 * 2. Validate that the payment amount matches the computed order total
 * 3. Store the transaction hash in the database for future checks
 */
@Service
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    /**
     * Create a new order after passing all fraud protection checks.
     *
     * @param request the order request from the frontend
     * @return OrderResponse with the order ID and status
     * @throws FraudCheckException if any fraud check fails
     */
    @Transactional
    public OrderResponse createOrder(OrderRequest request) {

        // --- FRAUD CHECK 1: Verify transaction hash is not reused ---
        if (request.getTransactionHash() == null || request.getTransactionHash().isBlank()) {
            throw new FraudCheckException("Transaction hash is required.");
        }

        if (orderRepository.existsByTransactionHash(request.getTransactionHash())) {
            throw new FraudCheckException(
                "Duplicate transaction detected. This transaction hash has already been used."
            );
        }

        // --- FRAUD CHECK 2: Validate payment amount matches computed total ---
        BigDecimal computedTotal = computeOrderTotal(request.getItems());
        BigDecimal submittedTotal = request.getTotalPrice().setScale(2, RoundingMode.HALF_UP);
        BigDecimal diff = computedTotal.subtract(submittedTotal).abs();

        // Allow a small tolerance of $0.01 for rounding differences
        if (diff.compareTo(new BigDecimal("0.01")) > 0) {
            throw new FraudCheckException(
                String.format(
                    "Payment amount mismatch. Expected: $%s, Received: $%s",
                    computedTotal, submittedTotal
                )
            );
        }

        // --- All checks passed — create the order ---
        Order order = new Order();
        order.setCustomerName(request.getCustomerName());
        order.setCustomerEmail(request.getCustomerEmail());
        order.setWalletAddress(request.getWalletAddress());
        order.setTotalPrice(computedTotal);
        order.setTransactionHash(request.getTransactionHash());
        order.setStatus(OrderStatus.CONFIRMED);

        // Map DTO items to entity items
        for (OrderItemDTO itemDTO : request.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(itemDTO.getProductId());
            orderItem.setProductName(itemDTO.getProductName());
            orderItem.setUnitPrice(itemDTO.getUnitPrice());
            orderItem.setQuantity(itemDTO.getQuantity());
            orderItem.setImageUrl(itemDTO.getImageUrl());
            order.addItem(orderItem);
        }

        // Save order (cascades to order items)
        Order savedOrder = orderRepository.save(order);

        return new OrderResponse(
            savedOrder.getId(),
            savedOrder.getStatus().name(),
            "Order confirmed. Payment verified successfully."
        );
    }

    /**
     * Retrieve order history for a customer by email.
     */
    public List<Order> getOrderHistory(String email) {
        return orderRepository.findByCustomerEmailOrderByDateCreatedDesc(email);
    }

    /**
     * Compute the total price from order items (server-side validation).
     * This prevents the client from submitting a manipulated total.
     */
    private BigDecimal computeOrderTotal(List<OrderItemDTO> items) {
        BigDecimal total = BigDecimal.ZERO;

        for (OrderItemDTO item : items) {
            BigDecimal lineTotal = item.getUnitPrice()
                .multiply(BigDecimal.valueOf(item.getQuantity()));
            total = total.add(lineTotal);
        }

        return total.setScale(2, RoundingMode.HALF_UP);
    }
}
