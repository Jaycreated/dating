// Web Push Notification Helper for Frontend
// Use this in your React app to register for web push notifications

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Register service worker for web push notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Get VAPID public key from backend
 */
async function getVapidPublicKey(): Promise<string | null> {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/notifications/vapid-key`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.log('Web push not configured on server');
      return null;
    }

    const data = await response.json();
    return data.publicKey;
  } catch (error) {
    console.error('Failed to get VAPID key:', error);
    return null;
  }
}

/**
 * Subscribe to web push notifications
 */
export async function subscribeToPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported');
    return false;
  }

  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('Already subscribed to push notifications');
      // Send subscription to backend anyway to ensure it's registered
      await sendSubscriptionToBackend(existingSubscription);
      return true;
    }

    // Get VAPID public key
    const publicKey = await getVapidPublicKey();
    if (!publicKey) {
      console.log('VAPID key not available');
      return false;
    }

    // Convert VAPID key to Uint8Array
    const convertedVapidKey = urlBase64ToUint8Array(publicKey);

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey as any
    });

    console.log('Push subscription created:', subscription);

    // Send subscription to backend
    await sendSubscriptionToBackend(subscription);

    return true;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return false;
  }
}

/**
 * Send push subscription to backend
 */
async function sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/api/notifications/web-subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      subscription: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.getKey('p256dh') ? 
            arrayBufferToBase64(subscription.getKey('p256dh')!) : '',
          auth: subscription.getKey('auth') ? 
            arrayBufferToBase64(subscription.getKey('auth')!) : ''
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error('Failed to send subscription to backend');
  }

  console.log('Push subscription sent to backend');
}

/**
 * Unsubscribe from web push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('Not subscribed to push notifications');
      return true;
    }

    // Unsubscribe from push
    await subscription.unsubscribe();

    // Remove subscription from backend
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/notifications/web-subscription`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint
      })
    });

    console.log('Unsubscribed from push notifications');
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe:', error);
    return false;
  }
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  const permission = await Notification.requestPermission();
  console.log('Notification permission:', permission);
  
  return permission === 'granted';
}

/**
 * Initialize web push notifications (call this on app startup after login)
 */
export async function initializeWebPush(): Promise<boolean> {
  // First request permission
  const permissionGranted = await requestNotificationPermission();
  if (!permissionGranted) {
    console.log('Notification permission denied');
    return false;
  }

  // Register service worker
  const registration = await registerServiceWorker();
  if (!registration) {
    return false;
  }

  // Subscribe to push notifications
  return await subscribeToPushNotifications();
}

/**
 * Convert URL base64 to Uint8Array (needed for VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
