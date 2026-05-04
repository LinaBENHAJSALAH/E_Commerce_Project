package backend.ec.ecommerce.dto;

import lombok.Data;
import java.math.BigDecimal;

/**
 * DTO for individual order items within an OrderRequest.
 */
@Data
public class OrderItemDTO {
    private String productId;
    private String productName;
    private BigDecimal unitPrice;
    private int quantity;
    private String imageUrl;
}
