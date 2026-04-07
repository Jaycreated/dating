import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

export interface AppleReceiptData {
  transactionId: string;
  receipt: string;
  productId: string;
}

interface AppleJWT {
  iss: string; // Team ID
  iat: number;
  exp: number;
  aud: string;
  nonce: string;
  bid: string; // Bundle ID
}

export interface AppleVerificationResult {
  isValid: boolean;
  productId: string;
  transactionId: string;
  originalTransactionId: string;
  purchaseDate: Date;
  expiresDate: Date;
  isRenewable: boolean;
  environment: 'Sandbox' | 'Production';
}

export class AppleIAPVerifier {
  private privateKey: string;
  private keyId: string;
  private issuerId: string;
  private bundleId: string;

  constructor(
    privateKey: string,
    keyId: string,
    issuerId: string,
    bundleId: string,
  ) {
    this.privateKey = privateKey;
    this.keyId = keyId;
    this.issuerId = issuerId;
    this.bundleId = bundleId;
  }

  private createJWT(): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: AppleJWT = {
      iss: this.issuerId,
      iat: now,
      exp: now + 3600,
      aud: 'appstoreconnect-v1',
      nonce: crypto.randomUUID(),
      bid: this.bundleId,
    };

    return jwt.sign(payload, this.privateKey, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: this.keyId,
        typ: 'JWT'
      },
    });
  }

  async verifyReceipt(receiptData: AppleReceiptData): Promise<AppleVerificationResult> {
    try {
      const token = this.createJWT();

      // For newer receipts (iOS 13.5+), use App Store Server API
      const response = await axios.post(
        `https://api.storekit.itunes.apple.com/inApps/v1/transactions/${receiptData.transactionId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const transaction = response.data.data;

      return {
        isValid: true,
        productId: transaction.productId,
        transactionId: transaction.transactionId,
        originalTransactionId: transaction.originalTransactionId,
        purchaseDate: new Date(transaction.purchaseDate),
        expiresDate: new Date(transaction.expiresDate),
        isRenewable: transaction.isUpgraded === false,
        environment: transaction.environment,
      };
    } catch (error: any) {
      console.error('Apple receipt verification failed:', error?.response?.data || error.message);
      throw new Error('Invalid Apple receipt');
    }
  }
}

// Alternative: For older receipts or as fallback, use legacy verification
export async function legacyAppleVerification(
  receiptData: string,
  sharedSecret?: string
): Promise<AppleVerificationResult> {
  const isSandbox = process.env.NODE_ENV === 'development';
  const url = isSandbox
    ? 'https://sandbox.itunes.apple.com/verifyReceipt'
    : 'https://buy.itunes.apple.com/verifyReceipt';

  try {
    const requestBody: any = {
      'receipt-data': receiptData,
    };
    
    if (sharedSecret) {
      requestBody.password = sharedSecret;
    }

    const response = await axios.post(url, requestBody);

    if (response.data.status !== 0) {
      throw new Error(
        `Apple verification failed with status ${response.data.status}`,
      );
    }

    const receipt = response.data.receipt;
    const latestReceipt = response.data['latest_receipt_info']?.[0] || receipt;

    return {
      isValid: true,
      productId: latestReceipt.product_id,
      transactionId: latestReceipt.transaction_id,
      originalTransactionId: latestReceipt.original_transaction_id,
      purchaseDate: new Date(parseInt(latestReceipt.purchase_date_ms)),
      expiresDate: new Date(parseInt(latestReceipt.expires_date_ms)),
      isRenewable: latestReceipt.is_trial_period === 'false',
      environment: isSandbox ? 'Sandbox' : 'Production',
    };
  } catch (error: any) {
    console.error('Legacy Apple verification failed:', error?.message);
    throw new Error('Invalid Apple receipt');
  }
}
