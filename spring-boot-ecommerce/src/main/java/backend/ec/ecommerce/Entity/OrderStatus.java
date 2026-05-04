package backend.ec.ecommerce.Entity;

/**
 * Enum representing the possible states of an order.
 */
public enum OrderStatus {
    PENDING,     // Order created, awaiting payment verification
    CONFIRMED,   // Payment verified and order confirmed
    REJECTED     // Payment failed fraud checks
}
