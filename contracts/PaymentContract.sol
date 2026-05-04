// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EcommercePayment
 * @dev Simple payment contract for the e-commerce platform.
 *
 * Features:
 * - Accept ETH payments from buyers
 * - Emit PaymentReceived event for off-chain tracking
 * - Allow the owner to withdraw collected funds
 * - Track total payments received
 *
 * Deployment:
 * 1. Open Remix IDE (https://remix.ethereum.org)
 * 2. Create a new file and paste this contract
 * 3. Compile with Solidity ^0.8.19
 * 4. Deploy to Sepolia testnet using MetaMask
 * 5. Copy the deployed contract address
 * 6. Update PAYMENT_ADDRESS in crypto.service.ts
 */
contract EcommercePayment {

    // Owner of the contract (deployer)
    address public owner;

    // Total ETH received by the contract
    uint256 public totalReceived;

    // Number of payments processed
    uint256 public paymentCount;

    /**
     * @dev Emitted when a payment is received.
     * @param buyer Address of the buyer
     * @param amount Amount of ETH sent (in Wei)
     * @param timestamp Block timestamp of the payment
     * @param paymentId Sequential payment identifier
     */
    event PaymentReceived(
        address indexed buyer,
        uint256 amount,
        uint256 timestamp,
        uint256 paymentId
    );

    /**
     * @dev Emitted when the owner withdraws funds.
     */
    event FundsWithdrawn(
        address indexed owner,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @dev Sets the deployer as the contract owner.
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Modifier to restrict functions to the owner only.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    /**
     * @dev Receive function — called when ETH is sent directly to the contract.
     * Emits a PaymentReceived event for off-chain tracking.
     */
    receive() external payable {
        require(msg.value > 0, "Payment must be greater than 0");

        paymentCount++;
        totalReceived += msg.value;

        emit PaymentReceived(
            msg.sender,
            msg.value,
            block.timestamp,
            paymentCount
        );
    }

    /**
     * @dev Fallback function for receiving ETH with data.
     */
    fallback() external payable {
        require(msg.value > 0, "Payment must be greater than 0");

        paymentCount++;
        totalReceived += msg.value;

        emit PaymentReceived(
            msg.sender,
            msg.value,
            block.timestamp,
            paymentCount
        );
    }

    /**
     * @dev Allows the owner to withdraw all collected funds.
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        payable(owner).transfer(balance);

        emit FundsWithdrawn(owner, balance, block.timestamp);
    }

    /**
     * @dev Returns the current contract balance.
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
