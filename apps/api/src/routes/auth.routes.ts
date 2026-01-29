import { Router } from 'express';
import { register, login, getMe, forgotPassword, resetPassword, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/password', authenticate, changePassword);

export default router;
