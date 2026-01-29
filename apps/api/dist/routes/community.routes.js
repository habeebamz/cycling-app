"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const group_controller_1 = require("../controllers/group.controller");
const event_controller_1 = require("../controllers/event.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Groups
router.post('/groups', auth_middleware_1.authenticate, group_controller_1.createGroup);
router.get('/groups', auth_middleware_1.authenticateOptional, group_controller_1.getGroups); // Or public?
router.get('/groups/:id', auth_middleware_1.authenticateOptional, group_controller_1.getGroup);
router.put('/groups/:id', auth_middleware_1.authenticate, group_controller_1.updateGroup); // Update group details
router.delete('/groups/:id', auth_middleware_1.authenticate, group_controller_1.deleteGroup);
router.post('/groups/join', auth_middleware_1.authenticate, group_controller_1.joinGroup);
router.post('/groups/leave', auth_middleware_1.authenticate, group_controller_1.leaveGroup);
router.post('/groups/notifications', auth_middleware_1.authenticate, group_controller_1.toggleGroupNotifications); // Legacy? Maybe use /groups/:id/notifications pattern for consistency
router.put('/groups/role', auth_middleware_1.authenticate, group_controller_1.updateGroupMemberRole);
router.post('/groups/:id/appeal', auth_middleware_1.authenticate, group_controller_1.submitBanAppeal);
router.post('/groups/:id/lift-ban', auth_middleware_1.authenticate, group_controller_1.liftGroupBan);
router.post('/groups/invite', auth_middleware_1.authenticate, group_controller_1.inviteToGroup);
router.post('/groups/posts', auth_middleware_1.authenticate, group_controller_1.createGroupPost);
router.get('/groups/:id/posts', auth_middleware_1.authenticateOptional, group_controller_1.getGroupPosts);
router.get('/groups/:id/leaderboard', auth_middleware_1.authenticateOptional, group_controller_1.getGroupLeaderboard);
router.get('/groups/:id/members', auth_middleware_1.authenticateOptional, group_controller_1.getGroupMembers);
router.post('/posts/:postId/like', auth_middleware_1.authenticate, group_controller_1.togglePostLike);
router.post('/posts/:postId/comments', auth_middleware_1.authenticate, group_controller_1.addPostComment);
router.get('/posts/:postId/comments', auth_middleware_1.authenticateOptional, group_controller_1.getPostComments);
router.put('/posts/:postId', auth_middleware_1.authenticate, group_controller_1.updateGroupPost);
router.delete('/posts/:postId', auth_middleware_1.authenticate, group_controller_1.deleteGroupPost);
// Events
router.post('/events', auth_middleware_1.authenticate, event_controller_1.createEvent);
router.get('/events', auth_middleware_1.authenticateOptional, event_controller_1.getEvents); // Future events
router.get('/events/:id', auth_middleware_1.authenticateOptional, event_controller_1.getEvent);
router.put('/events/:id', auth_middleware_1.authenticate, event_controller_1.updateEvent); // Update event details
router.post('/events/join', auth_middleware_1.authenticate, event_controller_1.joinEvent);
router.post('/events/leave', auth_middleware_1.authenticate, event_controller_1.leaveEvent);
router.put('/events/role', auth_middleware_1.authenticate, event_controller_1.updateEventParticipantRole);
router.delete('/events/:id', auth_middleware_1.authenticate, event_controller_1.deleteEvent);
router.post('/events/:id/notifications', auth_middleware_1.authenticate, event_controller_1.toggleEventNotifications);
router.post('/events/invite', auth_middleware_1.authenticate, event_controller_1.inviteToEvent);
exports.default = router;
