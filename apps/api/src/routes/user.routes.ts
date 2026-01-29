import { Router } from 'express';
import { followUser, unfollowUser } from '../controllers/social.controller';
import { getUserProfile, updateUserProfile, uploadProfilePhoto, getUsers, getUserGroups, getUserFollowers, getUserFollowing, getComparisonStats, getFriends } from '../controllers/user.controller';
import { authenticate, authenticateOptional } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

// Social
router.post('/follow', authenticate, followUser);
router.post('/unfollow', authenticate, unfollowUser);

// User
// Me routes (must be before :username)
router.get('/me/groups', authenticate, getUserGroups);
router.get('/me/friends', authenticate, getFriends);

// Search users
router.get('/', authenticateOptional, getUsers);
router.get('/:username', authenticateOptional, getUserProfile); // Public but auth aware
router.get('/:username/stats', authenticateOptional, getComparisonStats); // Comparison stats
router.put('/profile', authenticate, updateUserProfile);
router.post('/profile/photo', authenticate, upload.single('image'), uploadProfilePhoto);
router.get('/:username/followers', getUserFollowers);
router.get('/:username/following', getUserFollowing);

export default router;
