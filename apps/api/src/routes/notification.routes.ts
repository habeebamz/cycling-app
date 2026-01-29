import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getNotifications, markRead, markAllRead } from '../controllers/notification.controller';

const router = Router();

router.get('/', authenticate, getNotifications);
router.put('/:id/read', authenticate, markRead);
router.put('/read-all', authenticate, markAllRead);

export default router;
