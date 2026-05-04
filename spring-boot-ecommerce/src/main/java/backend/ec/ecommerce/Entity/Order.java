package backend.ec.ecommerce.Entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Order entity representing a customer purchase.
 * Each order contains customer info, payment details (tx hash),
 * and a list of ordered items.
 *
 * The transactionHash field has a unique constraint for fraud protection —
 * preventing the same blockchain transaction from being used twice.
 */
@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "customer_email", nullable = false)
    private String customerEmail;

    @Column(name = "wallet_address")
    private String walletAddress;

    @Column(name = "total_price", nullable = false)
    private BigDecimal totalPrice;

    /**
     * Ethereum transaction hash — must be unique to prevent
     * reuse of the same payment for multiple orders (fraud protection).
     */
    @Column(name = "transaction_hash", unique = true, nullable = false)
    private String transactionHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OrderStatus status;

    @Column(name = "date_created")
    @CreationTimestamp
    private Date dateCreated;

    /**
     * Cascade all operations to order items.
     * When an order is saved, its items are automatically persisted.
     */
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "order", fetch = FetchType.LAZY)
    private List<OrderItem> items = new ArrayList<>();

    /**
     * Helper method to add an item and set the bidirectional relationship.
     */
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
}
