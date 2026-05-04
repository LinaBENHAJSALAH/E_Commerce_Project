package backend.ec.ecommerce.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for incoming order creation requests from the Angular frontend.
 */
@Data
public class OrderRequest {
    private String customerName;
    private String customerEmail;
    private String walletAddress;
    private BigDecimal totalPrice;
    private String transactionHash;
    private List<OrderItemDTO> items;
}
