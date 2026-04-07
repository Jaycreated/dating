import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import webpush from 'web-push';
import { pool } from '../config/database';

// Create a new Expo SDK client
const expo = new Expo();

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = (process.env.VAPID_PUBLIC_KEY || '').replace(/=/g, '');
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@pairfect.com.ng';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  console.log('✅ Web Push configured with VAPID keys');
} else {
  console.warn('⚠️ VAPID keys not set - web push notifications will not work');
}

export interface PushNotificationData {
  title: string;
  body: string;
  data?: {
    type: 'match' | 'like' | 'message';
    url?: string;
    matchId?: number;
    fromUserId?: number;
    [key: string]: any;
  };
}

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class NotificationService {
  /**
   * Send push notification to a specific user (both mobile and web)
   */
  static async sendPushNotification(
    userId: number,
    notification: PushNotificationData
  ): Promise<void> {
    // Try mobile (Expo) first
    await this.sendExpoPushNotification(userId, notification);
    
    // Also send to web push subscriptions
    await this.sendWebPushNotifications(userId, notification);
  }

  /**
   * Send Expo push notification (mobile app)
   */
  static async sendExpoPushNotification(
    userId: number,
    notification: PushNotificationData
  ): Promise<void> {
    try {
      // Get user's push token from database
      const result = await pool.query(
        'SELECT push_token FROM users WHERE id = $1',
        [userId]
      );

      const pushToken = result.rows[0]?.push_token;

      if (!pushToken) {
        console.log(`No Expo push token found for user ${userId}`);
        return;
      }

      // Check that token is valid Expo push token
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        return;
      }

      // Construct the message
      const message: ExpoPushMessage = {
        to: pushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        priority: 'high',
        channelId: 'default',
      };

      // Send the notification
      const chunks = expo.chunkPushNotifications([message]);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
          console.log(`Expo push notification sent to user ${userId}:`, ticketChunk);
        } catch (error) {
          console.error('Error sending Expo push notification chunk:', error);
        }
      }

      // Check for errors in tickets
      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          console.error('Expo push notification error:', ticket.message);
          
          // If token is invalid, remove it from database
          if (ticket.details?.error === 'DeviceNotRegistered') {
            await this.removePushToken(userId);
            console.log(`Removed invalid Expo push token for user ${userId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error in sendExpoPushNotification:', error);
    }
  }

  /**
   * Send web push notifications to all browser subscriptions for a user
   */
  static async sendWebPushNotifications(
    userId: number,
    notification: PushNotificationData
  ): Promise<void> {
    try {
      if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.log('Web Push not configured - skipping');
        return;
      }

      // Get all web push subscriptions for this user
      const result = await pool.query(
        'SELECT endpoint, p256dh, auth FROM web_push_subscriptions WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        console.log(`No web push subscriptions found for user ${userId}`);
        return;
      }

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        data: notification.data,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: notification.data?.type || 'default',
        requireInteraction: true,
      });

      // Send to each subscription
      for (const row of result.rows) {
        const subscription = {
          endpoint: row.endpoint,
          keys: {
            p256dh: row.p256dh,
            auth: row.auth,
          },
        };

        try {
          await webpush.sendNotification(subscription, payload);
          console.log(`Web push notification sent to user ${userId}`);
        } catch (error: any) {
          console.error('Error sending web push notification:', error);
          
          // If subscription is invalid/expired, remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await this.removeWebPushSubscription(userId, row.endpoint);
            console.log(`Removed expired web push subscription for user ${userId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error in sendWebPushNotifications:', error);
    }
  }

  /**
   * Register web push subscription for a user
   */
  static async registerWebPushSubscription(
    userId: number,
    subscription: WebPushSubscription
  ): Promise<void> {
    await pool.query(
      `INSERT INTO web_push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, endpoint) 
       DO UPDATE SET p256dh = $3, auth = $4, updated_at = CURRENT_TIMESTAMP`,
      [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
    );

    console.log(`Registered web push subscription for user ${userId}`);
  }

  /**
   * Remove a specific web push subscription
   */
  static async removeWebPushSubscription(
    userId: number,
    endpoint: string
  ): Promise<void> {
    await pool.query(
      'DELETE FROM web_push_subscriptions WHERE user_id = $1 AND endpoint = $2',
      [userId, endpoint]
    );

    console.log(`Removed web push subscription for user ${userId}`);
  }

  /**
   * Remove all web push subscriptions for a user (e.g., on logout)
   */
  static async removeAllWebPushSubscriptions(userId: number): Promise<void> {
    await pool.query(
      'DELETE FROM web_push_subscriptions WHERE user_id = $1',
      [userId]
    );

    console.log(`Removed all web push subscriptions for user ${userId}`);
  }

  /**
   * Send push notifications to multiple users (both mobile and web)
   */
  static async sendPushNotificationsToMultiple(
    userIds: number[],
    notification: PushNotificationData
  ): Promise<void> {
    // Send to all users
    for (const userId of userIds) {
      await this.sendPushNotification(userId, notification);
    }
  }

  /**
   * Register/update Expo push token for a user (mobile app)
   */
  static async registerPushToken(userId: number, pushToken: string): Promise<void> {
    if (!Expo.isExpoPushToken(pushToken)) {
      throw new Error('Invalid Expo push token');
    }

    await pool.query(
      'UPDATE users SET push_token = $1 WHERE id = $2',
      [pushToken, userId]
    );

    console.log(`Registered Expo push token for user ${userId}`);
  }

  /**
   * Remove Expo push token for a user (e.g., on logout or token invalidation)
   */
  static async removePushToken(userId: number): Promise<void> {
    await pool.query(
      'UPDATE users SET push_token = NULL WHERE id = $1',
      [userId]
    );

    console.log(`Removed Expo push token for user ${userId}`);
  }

  /**
   * Get Expo push token for a user (for debugging)
   */
  static async getPushToken(userId: number): Promise<string | null> {
    const result = await pool.query(
      'SELECT push_token FROM users WHERE id = $1',
      [userId]
    );

    return result.rows[0]?.push_token || null;
  }

  /**
   * Get VAPID public key for frontend subscription
   */
  static getVapidPublicKey(): string | null {
    return VAPID_PUBLIC_KEY || null;
  }
}
