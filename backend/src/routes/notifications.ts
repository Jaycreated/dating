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

// PUT /api/notifications/:id/read
router.put('/:id/read', NotificationController.markAsRead);

// PUT /api/notifications/read-all
router.put('/read-all', NotificationController.markAllAsRead);

// DELETE /api/notifications/:id
router.delete('/:id', NotificationController.deleteNotification);

export default router;
