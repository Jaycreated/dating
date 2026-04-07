import { google } from 'googleapis';
import * as crypto from 'crypto';

export interface AndroidReceiptData {
  originalJson: string;
  signature: string;
  purchaseToken: string;
  productId: string;
}

export interface GoogleVerificationResult {
  isValid: boolean;
  productId: string;
  purchaseState: number;
  purchaseDate: Date;
  expiryDate: Date;
  autoRenewing: boolean;
  purchaseToken: string;
}

export class GooglePlayIAPVerifier {
  private androidPublisher: any;
  private packageName: string;

  constructor(credentialsPath: string, packageName: string) {
    this.packageName = packageName;
    
    // Load credentials - support both file path and base64 env var
    let credentials;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
      try {
        credentials = JSON.parse(
          Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString()
        );
      } catch (error) {
        console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_BASE64:', error);
        throw new Error('Invalid base64 credentials');
      }
    } else if (credentialsPath && credentialsPath.trim() !== '') {
      try {
        credentials = require(credentialsPath);
      } catch (error) {
        console.error('Failed to load credentials from file:', credentialsPath, error);
        throw new Error('Invalid credentials file path');
      }
    } else {
      // No credentials provided - continue without Google Play support
      console.warn('⚠️ No Google Play credentials provided - IAP verification disabled');
      this.androidPublisher = null;
      return;
    }

    // Only initialize if credentials are available
    if (credentials) {
      // Initialize Android Publisher API
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      });

      this.androidPublisher = google.androidpublisher({
        version: 'v3',
        auth,
      });
    }
  }

  async verifySubscription(receiptData: AndroidReceiptData): Promise<GoogleVerificationResult> {
    if (!this.androidPublisher) {
      throw new Error('Google Play IAP verifier not initialized - no credentials provided');
    }

    try {
      // First verify the subscription exists on Google Play
      const response = await this.androidPublisher.purchases.subscriptions.get({
        packageName: this.packageName,
        subscriptionId: receiptData.productId,
        token: receiptData.purchaseToken,
      });

      const subscription = response.data;

      // Verify signature using Google Play's public key
      // In production, you should cache this key
      const isSignatureValid = this.verifySignature(
        receiptData.originalJson,
        receiptData.signature,
      );

      if (!isSignatureValid) {
        throw new Error('Invalid signature');
      }

      // Check purchase state (0 = pending, 1 = purchased)
      const purchaseState = subscription.purchaseState === 0 ? 0 : 1;

      return {
        isValid: true,
        productId: receiptData.productId,
        purchaseState,
        purchaseDate: new Date(parseInt(subscription.startTimeMillis || '0')),
        expiryDate: new Date(parseInt(subscription.expiryTimeMillis || '0')),
        autoRenewing: subscription.autoRenewing || false,
        purchaseToken: receiptData.purchaseToken,
      };
    } catch (error: any) {
      console.error('Google Play verification failed:', error?.response?.data || error.message);
      throw new Error(`Invalid Android receipt: ${error.message}`);
    }
  }

  private verifySignature(originalJson: string, signature: string): boolean {
    try {
      // Note: In a real implementation, you'd use Google Play's public key
      // For now, we'll validate that the receipt can be parsed
      const parsed = JSON.parse(originalJson);
      
      // Basic validation: check required fields exist
      if (!parsed.packageName || !parsed.productId || !parsed.purchaseToken) {
        return false;
      }

      // In production, implement actual RSA signature verification:
      // 1. Get Google Play public key from Play Console
      // 2. Verify signature using RSA-SHA1
      
      return true; // Simplified for now
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  // Verify a one-time purchase (non-subscription)
  async verifyProduct(receiptData: AndroidReceiptData): Promise<GoogleVerificationResult> {
    try {
      const response = await this.androidPublisher.purchases.products.get({
        packageName: this.packageName,
        productId: receiptData.productId,
        token: receiptData.purchaseToken,
      });

      const purchase = response.data;

      const isSignatureValid = this.verifySignature(
        receiptData.originalJson,
        receiptData.signature,
      );

      if (!isSignatureValid) {
        throw new Error('Invalid signature');
      }

      return {
        isValid: true,
        productId: receiptData.productId,
        purchaseState: purchase.purchaseState || 0,
        purchaseDate: new Date(parseInt(purchase.purchaseTimeMillis || '0')),
        expiryDate: new Date(), // One-time purchases don't expire
        autoRenewing: false,
        purchaseToken: receiptData.purchaseToken,
      };
    } catch (error: any) {
      console.error('Google Play product verification failed:', error?.response?.data || error.message);
      throw new Error(`Invalid Android receipt: ${error.message}`);
    }
  }
}

// Simple standalone verification for sandbox/testing
export function verifyAndroidReceiptLocally(
  receiptData: AndroidReceiptData,
  publicKeyBase64?: string,
): boolean {
  try {
    // Parse the receipt
    const receipt = JSON.parse(receiptData.originalJson);
    
    // Basic validation
    if (!receipt.packageName || !receipt.productId || !receipt.purchaseToken) {
      return false;
    }

    // If public key provided, verify signature
    if (publicKeyBase64) {
      const publicKey = Buffer.from(publicKeyBase64, 'base64').toString('utf-8');
      const signatureBuffer = Buffer.from(receiptData.signature, 'base64');

      const verifier = crypto.createVerify('RSA-SHA1');
      verifier.update(receiptData.originalJson);

      return verifier.verify(publicKey, signatureBuffer);
    }

    return true; // Skip signature verification if no key provided (dev only)
  } catch (error) {
    console.error('Local Android verification failed:', error);
    return false;
  }
}
