package backend.ec.ecommerce.dao;

import backend.ec.ecommerce.Entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product,Long> {

}
