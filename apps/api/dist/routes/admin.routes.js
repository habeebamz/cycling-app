"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const admin_controller_1 = require("../controllers/admin.controller");
const report_controller_1 = require("../controllers/report.controller");
const router = express_1.default.Router();
// Protect all admin routes
router.use(auth_middleware_1.authenticate);
router.use(admin_middleware_1.requireAdmin);
router.get('/stats', admin_controller_1.getDashboardStats);
router.get('/users', admin_controller_1.getAllUsers);
router.delete('/users/:id', admin_controller_1.deleteUser);
router.patch('/users/:id/status', admin_controller_1.updateUserStatus);
router.get('/groups', admin_controller_1.getAllGroups);
router.patch('/groups/:id/status', admin_controller_1.updateGroupStatus);
router.delete('/groups/:id', admin_controller_1.deleteGroup);
router.get('/activities', admin_controller_1.getAllActivities);
router.delete('/activities/:id', admin_controller_1.deleteActivity);
router.get('/events', admin_controller_1.getAllEvents);
router.patch('/events/:id/status', admin_controller_1.updateEventStatus);
router.delete('/events/:id', admin_controller_1.deleteEvent);
router.get('/settings/email', admin_controller_1.getEmailSettings);
router.post('/settings/email', admin_controller_1.updateEmailSettings);
// Report management
router.get('/reports', report_controller_1.getReports);
router.patch('/reports/:id/status', report_controller_1.updateReportStatus);
router.delete('/reports/:id/post', report_controller_1.deletePostByReport);
router.delete('/reports/:id/activity', report_controller_1.deleteActivityByReport);
router.post('/reports/:id/suspend', report_controller_1.suspendEntityByReport);
router.post('/reports/:id/suspend-author', report_controller_1.suspendAuthorByReport);
exports.default = router;
