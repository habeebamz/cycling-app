import { Router } from 'express';
import { createChallenge, getGroupChallenges, joinChallenge, leaveChallenge, getChallengesForUserGroups, updateChallenge, deleteChallenge, uploadChallengePhoto, getChallenges, getChallengeById } from '../controllers/challenge.controller';
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

router.post('/', authenticate, createChallenge);
router.get('/', authenticateOptional, getChallenges); // Global search or list
router.get('/my-groups', authenticate, getChallengesForUserGroups);
router.get('/group/:groupId', authenticateOptional, getGroupChallenges);
router.get('/:id', authenticateOptional, getChallengeById);
router.post('/:id/join', authenticate, joinChallenge);
router.post('/:id/leave', authenticate, leaveChallenge);
router.put('/:id', authenticate, updateChallenge);
router.delete('/:id', authenticate, deleteChallenge);
router.post('/:id/photo', authenticate, upload.single('image'), uploadChallengePhoto);

export default router;
