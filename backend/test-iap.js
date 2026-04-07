// Test endpoint for IAP verification
// Add temporarily to payment.routes.ts for testing

router.post('/test-iap', authenticate, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const userId = (req as any).user?.id;
    
    // Mock iOS receipt (for testing)
    const mockIOSReceipt = {
      platform: 'ios',
      productId: 'com.pairfect.monthly',
      receipt: {
        transactionId: 'test_transaction_' + Date.now(),
        receipt: 'test_receipt_data',
        productId: 'com.pairfect.monthly',
        isIOS: true,
        isAndroid: false
      }
    };

    // Mock Android receipt (for testing)
    const mockAndroidReceipt = {
      platform: 'android',
      productId: 'com.pairfect.monthly',
      receipt: {
        originalJson: JSON.stringify({
          packageName: 'com.anonymous.Pairfect',
          productId: 'com.pairfect.monthly',
          purchaseToken: 'test_token_' + Date.now(),
          orderId: 'test.order.' + Date.now()
        }),
        signature: 'test_signature',
        purchaseToken: 'test_token_' + Date.now(),
        productId: 'com.pairfect.monthly',
        isIOS: false,
        isAndroid: true
      }
    };

    // Test iOS verification
    console.log('Testing iOS IAP verification...');
    try {
      const iosResponse = await fetch('http://localhost:5000/api/payments/verify-iap', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(req as any).token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockIOSReceipt)
      });
      
      const iosResult = await iosResponse.json();
      console.log('iOS Test Result:', iosResult);
    } catch (error) {
      console.error('iOS Test Failed:', error);
    }

    // Test Android verification
    console.log('Testing Android IAP verification...');
    try {
      const androidResponse = await fetch('http://localhost:5000/api/payments/verify-iap', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(req as any).token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mockAndroidReceipt)
      });
      
      const androidResult = await androidResponse.json();
      console.log('Android Test Result:', androidResult);
    } catch (error) {
      console.error('Android Test Failed:', error);
    }

    // Check database
    const dbCheck = await client.query(
      'SELECT COUNT(*) as count FROM iap_receipts WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'IAP tests completed',
      receiptsInDb: parseInt(dbCheck.rows[0].count),
      checkConsole: 'See backend console for detailed results'
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});
