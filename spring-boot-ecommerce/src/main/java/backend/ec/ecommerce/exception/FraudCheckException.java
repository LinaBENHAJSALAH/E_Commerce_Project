package backend.ec.ecommerce.exception;

/**
 * Custom exception thrown when fraud checks fail.
 * This covers duplicate transaction hashes and amount mismatches.
 */
public class FraudCheckException extends RuntimeException {

    public FraudCheckException(String message) {
        super(message);
    }
}
