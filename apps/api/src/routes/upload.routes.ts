
import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { upload, uploadProfilePicture } from '../controllers/upload.controller';

const router = express.Router();

router.post('/profile-picture', authenticate, upload.single('image'), uploadProfilePicture);

export default router;
