"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activity_controller_1 = require("../controllers/activity.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Configure Multer
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
router.post('/upload', auth_middleware_1.authenticate, upload.single('file'), activity_controller_1.uploadActivityFile);
router.post('/', auth_middleware_1.authenticate, activity_controller_1.createActivity);
router.get('/', auth_middleware_1.authenticateOptional, activity_controller_1.getActivities);
router.get('/:id', auth_middleware_1.authenticateOptional, activity_controller_1.getActivity);
router.put('/:id', auth_middleware_1.authenticate, activity_controller_1.updateActivity);
router.delete('/:id', auth_middleware_1.authenticate, activity_controller_1.deleteActivity);
router.post('/:id/photos', auth_middleware_1.authenticate, upload.array('photos', 5), activity_controller_1.uploadActivityPhotos);
router.delete('/:id/photos/:photoIndex', auth_middleware_1.authenticate, activity_controller_1.deleteActivityPhoto);
// Social
router.post('/:id/like', auth_middleware_1.authenticate, activity_controller_1.toggleLike);
router.post('/:id/comments', auth_middleware_1.authenticate, activity_controller_1.addComment);
router.get('/:id/comments', auth_middleware_1.authenticateOptional, activity_controller_1.getComments);
router.get('/:id/likes', auth_middleware_1.authenticateOptional, activity_controller_1.getActivityLikes);
exports.default = router;
