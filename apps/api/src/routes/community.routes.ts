import { Router } from 'express';
import { createGroup, getGroups, getGroup, joinGroup, updateGroupMemberRole, updateGroup, deleteGroup, leaveGroup, toggleGroupNotifications, createGroupPost, getGroupPosts, getGroupLeaderboard, getGroupMembers, togglePostLike, addPostComment, getPostComments, updateGroupPost, deleteGroupPost, inviteToGroup, submitBanAppeal, liftGroupBan } from '../controllers/group.controller';
import { createEvent, getEvents, getEvent, joinEvent, leaveEvent, updateEventParticipantRole, updateEvent, deleteEvent, toggleEventNotifications, inviteToEvent } from '../controllers/event.controller';
import { authenticate, authenticateOptional } from '../middleware/auth.middleware';

const router = Router();

// Groups
router.post('/groups', authenticate, createGroup);
router.get('/groups', authenticateOptional, getGroups); // Or public?
router.get('/groups/:id', authenticateOptional, getGroup);
router.put('/groups/:id', authenticate, updateGroup); // Update group details
router.delete('/groups/:id', authenticate, deleteGroup);
router.post('/groups/join', authenticate, joinGroup);
router.post('/groups/leave', authenticate, leaveGroup);
router.post('/groups/notifications', authenticate, toggleGroupNotifications); // Legacy? Maybe use /groups/:id/notifications pattern for consistency
router.put('/groups/role', authenticate, updateGroupMemberRole);
router.post('/groups/:id/appeal', authenticate, submitBanAppeal);
router.post('/groups/:id/lift-ban', authenticate, liftGroupBan);
router.post('/groups/invite', authenticate, inviteToGroup);
router.post('/groups/posts', authenticate, createGroupPost);
router.get('/groups/:id/posts', authenticateOptional, getGroupPosts);
router.get('/groups/:id/leaderboard', authenticateOptional, getGroupLeaderboard);
router.get('/groups/:id/members', authenticateOptional, getGroupMembers);
router.post('/posts/:postId/like', authenticate, togglePostLike);
router.post('/posts/:postId/comments', authenticate, addPostComment);
router.get('/posts/:postId/comments', authenticateOptional, getPostComments);
router.put('/posts/:postId', authenticate, updateGroupPost);
router.delete('/posts/:postId', authenticate, deleteGroupPost);

// Events
router.post('/events', authenticate, createEvent);
router.get('/events', authenticateOptional, getEvents); // Future events
router.get('/events/:id', authenticateOptional, getEvent);
router.put('/events/:id', authenticate, updateEvent); // Update event details
router.post('/events/join', authenticate, joinEvent);
router.post('/events/leave', authenticate, leaveEvent);
router.put('/events/role', authenticate, updateEventParticipantRole);
router.delete('/events/:id', authenticate, deleteEvent);
router.post('/events/:id/notifications', authenticate, toggleEventNotifications);
router.post('/events/invite', authenticate, inviteToEvent);

export default router;
