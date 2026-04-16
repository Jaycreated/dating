import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

export function createGoogleAuth() {
  // Option 1: Load from environment variable (production/VPS)
  if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
    const credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString()
    );

    return new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/androidpublisher']
    });
  }

  // Option 2: Load from file (local development)
  return new google.auth.GoogleAuth({
    keyFile: '/var/www/pairfect.com.ng/backend/service-account.json',
    scopes: ['https://www.googleapis.com/auth/androidpublisher']
  });
}

export function createAndroidPublisher() {
  const auth = createGoogleAuth();

  return google.androidpublisher({
    version: 'v3',
    auth
  });
}
