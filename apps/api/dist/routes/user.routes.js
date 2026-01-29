"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const social_controller_1 = require("../controllers/social.controller");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage: storage });
const router = (0, express_1.Router)();
// Social
router.post('/follow', auth_middleware_1.authenticate, social_controller_1.followUser);
router.post('/unfollow', auth_middleware_1.authenticate, social_controller_1.unfollowUser);
// User
// Me routes (must be before :username)
router.get('/me/groups', auth_middleware_1.authenticate, user_controller_1.getUserGroups);
router.get('/me/friends', auth_middleware_1.authenticate, user_controller_1.getFriends);
// Search users
router.get('/', auth_middleware_1.authenticateOptional, user_controller_1.getUsers);
router.get('/:username', auth_middleware_1.authenticateOptional, user_controller_1.getUserProfile); // Public but auth aware
router.get('/:username/stats', auth_middleware_1.authenticateOptional, user_controller_1.getComparisonStats); // Comparison stats
router.put('/profile', auth_middleware_1.authenticate, user_controller_1.updateUserProfile);
router.post('/profile/photo', auth_middleware_1.authenticate, upload.single('image'), user_controller_1.uploadProfilePhoto);
router.get('/:username/followers', user_controller_1.getUserFollowers);
router.get('/:username/following', user_controller_1.getUserFollowing);
exports.default = router;
