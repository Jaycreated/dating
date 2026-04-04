import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/notifications
router.get('/', NotificationController.getNotifications);

// GET /api/notifications/unread/count
router.get('/unread/count', NotificationController.getUnreadCount);

// POST /api/notifications/register - Register Expo push token
router.post('/register', NotificationController.registerPushToken);

// DELETE /api/notifications/push-token - Remove Expo push token
router.delete('/push-token', NotificationController.removePushToken);

// GET /api/notifications/vapid-key - Get VAPID public key for web push
router.get('/vapid-key', NotificationController.getVapidKey);

// POST /api/notifications/web-subscription - Register web push subscription
router.post('/web-subscription', NotificationController.registerWebSubscription);

// DELETE /api/notifications/web-subscription - Remove web push subscription
router.delete('/web-subscription', NotificationController.removeWebSubscription);

// PUT /api/notifications/:id/read
router.put('/:id/read', NotificationController.markAsRead);

// PUT /api/notifications/read-all
router.put('/read-all', NotificationController.markAllAsRead);

// DELETE /api/notifications/:id
router.delete('/:id', NotificationController.deleteNotification);

export default router;
