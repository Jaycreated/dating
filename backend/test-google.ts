import { google } from 'googleapis';

async function test() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'service-account.json',
    scopes: ['https://www.googleapis.com/auth/androidpublisher']
  });

  const androidPublisher = google.androidpublisher({
    version: 'v3',
    auth
  });

  try {
    await androidPublisher.purchases.subscriptions.get({
      packageName: 'com.anonymous.Pairfect',
      subscriptionId: 'test_product',
      token: 'fake_token'
    });
  } catch (error: any) {
    console.log('Result:', error.message);
  }
}

test();