package backend.ec.ecommerce.dao;

import backend.ec.ecommerce.Entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository for Order entity.
 * Provides custom queries for fraud detection and order history.
 */
public interface OrderRepository extends JpaRepository<Order, Long> {

    /**
     * Check if a transaction hash already exists in the database.
     * Used for fraud protection — prevents reuse of the same TX hash.
     */
    boolean existsByTransactionHash(String transactionHash);

    /**
     * Retrieve order history for a customer, sorted by newest first.
     */
    List<Order> findByCustomerEmailOrderByDateCreatedDesc(String customerEmail);
}
