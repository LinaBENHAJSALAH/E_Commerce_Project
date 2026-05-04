import { Injectable } from '@angular/core';
import { ethers } from 'ethers';

/**
 * CryptoService handles MetaMask wallet interactions and Ethereum payments.
 * Uses ethers.js v6 with BrowserProvider for MetaMask integration.
 * Targets the Sepolia testnet for demo/testing purposes.
 */
@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  // Demo contract address on Sepolia testnet (placeholder)
  // Replace with your deployed contract address
  private readonly PAYMENT_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f5bA16';

  // Fixed conversion rate: 1 ETH = 2000 USD
  private readonly ETH_USD_RATE = 2000;

  // Sepolia chain ID (hex)
  private readonly SEPOLIA_CHAIN_ID = '0xaa36a7';

  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  constructor() { }

  /**
   * Check if MetaMask is installed in the browser.
   */
  isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
  }

  /**
   * Connect to MetaMask wallet and request account access.
   * Returns the connected wallet address.
   */
  async connectWallet(): Promise<string> {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to proceed.');
    }

    try {
      // Request account access from MetaMask
      this.provider = new ethers.BrowserProvider(window.ethereum!);

      // Prompt user to connect their wallet
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Ensure we're on Sepolia testnet
      await this.switchToSepolia();

      // Get the signer for transaction signing
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();

      return address;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('Connection rejected by user.');
      }
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }

  /**
   * Get the currently connected wallet address, or null if not connected.
   */
  async getWalletAddress(): Promise<string | null> {
    if (!this.signer) return null;
    try {
      return await this.signer.getAddress();
    } catch {
      return null;
    }
  }

  /**
   * Get the ETH balance of the connected wallet.
   */
  async getBalance(): Promise<string> {
    if (!this.provider || !this.signer) {
      throw new Error('Wallet not connected.');
    }
    const address = await this.signer.getAddress();
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  /**
   * Convert a USD amount to ETH using the fixed conversion rate.
   * Rate: 1 ETH = 2000 USD
   */
  convertUsdToEth(usdAmount: number): string {
    const ethAmount = usdAmount / this.ETH_USD_RATE;
    // Return with 18 decimal precision for Wei conversion
    return ethAmount.toFixed(18);
  }

  /**
   * Send an ETH payment to the demo contract address.
   * Converts USD total to ETH, then sends the transaction.
   * Returns the transaction hash on success.
   */
  async sendPayment(totalUsd: number): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected. Please connect MetaMask first.');
    }

    // Convert USD to ETH
    const ethAmount = this.convertUsdToEth(totalUsd);
    const weiAmount = ethers.parseEther(ethAmount);

    try {
      // Build and send the transaction
      const tx = await this.signer.sendTransaction({
        to: this.PAYMENT_ADDRESS,
        value: weiAmount,
      });

      // Wait for the transaction to be mined (1 confirmation)
      const receipt = await tx.wait(1);

      if (!receipt) {
        throw new Error('Transaction failed — no receipt received.');
      }

      // Return the transaction hash
      return tx.hash;
    } catch (error: any) {
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        throw new Error('Transaction rejected by user.');
      }
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Get the fixed ETH/USD rate used for conversions.
   */
  getEthUsdRate(): number {
    return this.ETH_USD_RATE;
  }

  /**
   * Switch MetaMask to the Sepolia testnet.
   * If Sepolia is not added, attempt to add it.
   */
  private async switchToSepolia(): Promise<void> {
    try {
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: this.SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // Chain not added to MetaMask — try adding it
      if (switchError.code === 4902) {
        await window.ethereum!.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: this.SEPOLIA_CHAIN_ID,
            chainName: 'Sepolia Testnet',
            rpcUrls: ['https://rpc.sepolia.org'],
            nativeCurrency: {
              name: 'SepoliaETH',
              symbol: 'ETH',
              decimals: 18
            },
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }],
        });
      } else {
        throw new Error('Failed to switch to Sepolia testnet.');
      }
    }
  }
}
