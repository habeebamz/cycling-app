import { Router } from 'express';
import { createActivity, getActivities, getActivity, deleteActivity, uploadActivityPhotos, deleteActivityPhoto, uploadActivityFile, toggleLike, addComment, getComments, updateActivity, getActivityLikes } from '../controllers/activity.controller';
import { authenticate, authenticateOptional } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const router = Router();

router.post('/upload', authenticate, upload.single('file'), uploadActivityFile);
router.post('/', authenticate, createActivity);
router.get('/', authenticateOptional, getActivities);
router.get('/:id', authenticateOptional, getActivity);
router.put('/:id', authenticate, updateActivity);
router.delete('/:id', authenticate, deleteActivity);
router.post('/:id/photos', authenticate, upload.array('photos', 5), uploadActivityPhotos);
router.delete('/:id/photos/:photoIndex', authenticate, deleteActivityPhoto);

// Social
router.post('/:id/like', authenticate, toggleLike);
router.post('/:id/comments', authenticate, addComment);
router.get('/:id/comments', authenticateOptional, getComments);
router.get('/:id/likes', authenticateOptional, getActivityLikes);

export default router;
