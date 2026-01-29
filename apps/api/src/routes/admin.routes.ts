
import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import {
    getDashboardStats, getAllUsers, deleteUser, updateUserStatus,
    getAllGroups, updateGroupStatus, deleteGroup,
    getAllActivities, deleteActivity,
    getAllEvents, updateEventStatus, deleteEvent,
    getEmailSettings, updateEmailSettings
} from '../controllers/admin.controller';
import { getReports, updateReportStatus, deletePostByReport, suspendEntityByReport, deleteActivityByReport, suspendAuthorByReport } from '../controllers/report.controller';

const router = express.Router();

// Protect all admin routes
router.use(authenticate);
router.use(requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/status', updateUserStatus);

router.get('/groups', getAllGroups);
router.patch('/groups/:id/status', updateGroupStatus);
router.delete('/groups/:id', deleteGroup);

router.get('/activities', getAllActivities);
router.delete('/activities/:id', deleteActivity);

router.get('/events', getAllEvents);
router.patch('/events/:id/status', updateEventStatus);
router.delete('/events/:id', deleteEvent);

router.get('/settings/email', getEmailSettings);
router.post('/settings/email', updateEmailSettings);

// Report management
router.get('/reports', getReports);
router.patch('/reports/:id/status', updateReportStatus);
router.delete('/reports/:id/post', deletePostByReport);
router.delete('/reports/:id/activity', deleteActivityByReport);
router.post('/reports/:id/suspend', suspendEntityByReport);
router.post('/reports/:id/suspend-author', suspendAuthorByReport);

export default router;
