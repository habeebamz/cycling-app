"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.suspendAuthorByReport = exports.deleteActivityByReport = exports.suspendEntityByReport = exports.deletePostByReport = exports.updateReportStatus = exports.getReports = exports.createReport = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const createReport = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { postId, targetUserId, activityId, groupId, eventId, reason, details } = req.body;
        if (!reason) {
            return res.status(400).json({ message: 'Reason is required' });
        }
        if (!postId && !targetUserId && !activityId && !groupId && !eventId) {
            return res.status(400).json({ message: 'Target ID (post, user, activity, group, or event) is required' });
        }
        // Validate existence based on provided ID
        let targetType = '';
        let targetName = '';
        if (postId) {
            const post = await prisma_1.default.post.findUnique({ where: { id: postId }, include: { user: true } });
            if (!post)
                return res.status(404).json({ message: 'Post not found' });
            targetType = 'post';
            targetName = post.user.username;
        }
        else if (targetUserId) {
            const user = await prisma_1.default.user.findUnique({ where: { id: targetUserId } });
            if (!user)
                return res.status(404).json({ message: 'User not found' });
            targetType = 'user';
            targetName = user.username;
        }
        else if (activityId) {
            const activity = await prisma_1.default.activity.findUnique({ where: { id: activityId }, include: { user: true } });
            if (!activity)
                return res.status(404).json({ message: 'Activity not found' });
            targetType = 'activity';
            targetName = activity.user.username;
        }
        else if (groupId) {
            const group = await prisma_1.default.group.findUnique({ where: { id: groupId } });
            if (!group)
                return res.status(404).json({ message: 'Group/Club not found' });
            targetType = 'group';
            targetName = group.name;
        }
        else if (eventId) {
            const event = await prisma_1.default.event.findUnique({ where: { id: eventId } });
            if (!event)
                return res.status(404).json({ message: 'Event not found' });
            targetType = 'event';
            targetName = event.title;
        }
        const report = await prisma_1.default.violationReport.create({
            data: {
                reporterId: userId,
                postId,
                targetUserId,
                activityId,
                groupId,
                eventId,
                reason,
                details,
                status: 'PENDING'
            }
        });
        // Notify Admins
        const admins = await prisma_1.default.user.findMany({
            where: { role: 'ADMIN' }
        });
        for (const admin of admins) {
            await prisma_1.default.notification.create({
                data: {
                    userId: admin.id,
                    type: 'VIOLATION_REPORT',
                    message: `New violation report for ${targetType}: ${targetName}`,
                    link: `/hradmin/violations?reportId=${report.id}`
                }
            });
        }
        res.status(201).json({ message: 'Report submitted successfully', report });
    }
    catch (error) {
        console.error('Error creating report:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.createReport = createReport;
const getReports = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        // Check if user is admin
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.role !== 'EDITOR')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const reports = await prisma_1.default.violationReport.findMany({
            include: {
                reporter: {
                    select: { id: true, username: true, image: true }
                },
                post: {
                    include: { user: { select: { id: true, username: true, image: true } } }
                },
                targetUser: {
                    select: { id: true, username: true, image: true, email: true }
                },
                activity: {
                    include: { user: { select: { id: true, username: true, image: true } } }
                },
                group: {
                    select: { id: true, name: true, image: true, type: true }
                },
                event: {
                    select: { id: true, title: true, image: true, startTime: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        // Fetch pending group ban appeals
        const pendingAppeals = await prisma_1.default.groupMember.findMany({
            where: { banAppealStatus: 'PENDING' },
            include: {
                user: { select: { id: true, username: true, image: true, email: true, firstName: true } },
                group: { select: { id: true, name: true, image: true, type: true } }
            }
        });
        // Map appeals to a similar structure as reports
        const mappedAppeals = pendingAppeals.map((appeal) => ({
            id: `appeal-${appeal.id}`,
            reason: 'Ban Removal Request',
            details: appeal.banAppealMessage,
            status: appeal.banAppealStatus,
            createdAt: appeal.joinedAt, // Using joinedAt or we might need an appealDate? joinedAt is fine for now
            type: 'APPEAL',
            reporter: appeal.user,
            targetUser: appeal.user,
            group: appeal.group,
            memberId: appeal.id // Store original member ID for lifting ban
        }));
        // Combine and sort
        const combined = [...reports, ...mappedAppeals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json(combined);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getReports = getReports;
const updateReportStatus = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id;
        const { status } = req.body;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        // Check if user is admin, manager, or editor
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user || !['ADMIN', 'MANAGER', 'EDITOR'].includes(user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const report = await prisma_1.default.violationReport.update({
            where: { id },
            data: { status }
        });
        res.json({ message: 'Report updated', report });
    }
    catch (error) {
        console.error('Error updating report status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.updateReportStatus = updateReportStatus;
const deletePostByReport = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id; // report id
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        // Check if user is admin
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const report = await prisma_1.default.violationReport.findUnique({
            where: { id },
            include: { post: true }
        });
        if (!report || !report.post || !report.postId) {
            return res.status(404).json({ message: 'Report or post not found' });
        }
        // Delete post
        await prisma_1.default.post.delete({
            where: { id: report.postId }
        });
        // Mark report as resolved
        await prisma_1.default.violationReport.update({
            where: { id },
            data: { status: 'RESOLVED' }
        });
        res.json({ message: 'Post deleted and report resolved' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deletePostByReport = deletePostByReport;
const suspendEntityByReport = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id; // report id
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        // Check if current user is admin, manager, or editor
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user || !['ADMIN', 'MANAGER', 'EDITOR'].includes(user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const report = await prisma_1.default.violationReport.findUnique({
            where: { id },
            include: {
                targetUser: true,
                group: true,
                event: true
            }
        });
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        let suspendedEntity = '';
        // Handle User Suspension (potentially group-specific)
        if (report.targetUserId && report.targetUser) {
            // Check if there's a group context
            if (report.groupId) {
                const membership = await prisma_1.default.groupMember.findUnique({
                    where: { userId_groupId: { userId: report.targetUserId, groupId: report.groupId } }
                });
                // Check roles: "club admin, editor, manager, and system admin"
                const isSystemStaff = ['ADMIN', 'MANAGER', 'EDITOR'].includes(report.targetUser.role);
                const isGroupAdmin = membership?.role === 'ADMIN';
                if (isSystemStaff || isGroupAdmin) {
                    await prisma_1.default.groupMember.update({
                        where: { userId_groupId: { userId: report.targetUserId, groupId: report.groupId } },
                        data: { status: 'SUSPENDED', banExpiresAt: null } // Permanent
                    });
                    suspendedEntity = `${isGroupAdmin ? 'Group Admin' : 'Staff Member'} @${report.targetUser.username} membership in group`;
                }
                else {
                    // Fallback to global if not a "special" role? 
                    // Or maybe the user wants them suspended globally anyway.
                    await prisma_1.default.user.update({
                        where: { id: report.targetUserId },
                        data: { status: 'SUSPENDED' }
                    });
                    suspendedEntity = `User @${report.targetUser.username} globally`;
                }
            }
            else {
                await prisma_1.default.user.update({
                    where: { id: report.targetUserId },
                    data: { status: 'SUSPENDED' }
                });
                suspendedEntity = `User @${report.targetUser.username} globally`;
            }
        }
        else if (report.groupId && report.group) {
            await prisma_1.default.group.update({
                where: { id: report.groupId },
                data: { status: 'SUSPENDED' }
            });
            suspendedEntity = `${report.group.type === 'CLUB' ? 'Club' : 'Group'} "${report.group.name}"`;
        }
        else if (report.eventId && report.event) {
            await prisma_1.default.event.update({
                where: { id: report.eventId },
                data: { status: 'SUSPENDED' }
            });
            suspendedEntity = `Event "${report.event.title}"`;
        }
        else {
            return res.status(400).json({ message: 'Cannot suspend this type of entity' });
        }
        // Mark report as resolved
        await prisma_1.default.violationReport.update({
            where: { id },
            data: { status: 'RESOLVED' }
        });
        res.json({ message: `${suspendedEntity} suspended and report resolved` });
    }
    catch (error) {
        console.error('Error suspending entity:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.suspendEntityByReport = suspendEntityByReport;
const deleteActivityByReport = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id; // report id
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        // Check if user is admin
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const report = await prisma_1.default.violationReport.findUnique({
            where: { id },
            include: { activity: true }
        });
        if (!report || !report.activity || !report.activityId) {
            return res.status(404).json({ message: 'Report or activity not found' });
        }
        // Delete activity
        await prisma_1.default.activity.delete({
            where: { id: report.activityId }
        });
        // Mark report as resolved
        await prisma_1.default.violationReport.update({
            where: { id },
            data: { status: 'RESOLVED' }
        });
        res.json({ message: 'Activity deleted and report resolved' });
    }
    catch (error) {
        console.error('Error deleting activity:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.deleteActivityByReport = deleteActivityByReport;
const suspendAuthorByReport = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id; // report id
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        // Check if user is admin, manager, or editor
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user || !['ADMIN', 'MANAGER', 'EDITOR'].includes(user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const report = await prisma_1.default.violationReport.findUnique({
            where: { id },
            include: {
                post: { include: { user: true } },
                activity: { include: { user: true } }
            }
        });
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        let authorId = null;
        let authorUsername = '';
        let groupId = report.groupId;
        // Get author and group from post or activity
        if (report.post && report.post.user) {
            authorId = report.post.user.id;
            authorUsername = report.post.user.username;
            groupId = report.post.groupId || groupId;
        }
        else if (report.activity && report.activity.user) {
            authorId = report.activity.user.id;
            authorUsername = report.activity.user.username;
            // Activities might not have a groupId directly, check report's groupId
        }
        if (!authorId) {
            return res.status(400).json({ message: 'Cannot find author to suspend' });
        }
        // If in group context, apply tiered ban
        if (groupId) {
            const membership = await prisma_1.default.groupMember.findUnique({
                where: { userId_groupId: { userId: authorId, groupId } }
            });
            if (membership) {
                const newCount = (membership.violationCount || 0) + 1;
                let days = 7;
                if (newCount === 2)
                    days = 30;
                else if (newCount >= 3)
                    days = 365;
                const banExpiresAt = new Date();
                banExpiresAt.setDate(banExpiresAt.getDate() + days);
                await prisma_1.default.groupMember.update({
                    where: { id: membership.id },
                    data: {
                        violationCount: newCount,
                        banExpiresAt,
                        status: 'SUSPENDED'
                    }
                });
                // Mark report as resolved
                await prisma_1.default.violationReport.update({
                    where: { id },
                    data: { status: 'RESOLVED' }
                });
                return res.json({
                    message: `User @${authorUsername} suspended from group for ${days} days (Violation #${newCount})`
                });
            }
        }
        // Fallback or if no group context: Suspend the author globally
        await prisma_1.default.user.update({
            where: { id: authorId },
            data: { status: 'SUSPENDED' }
        });
        // Mark report as resolved
        await prisma_1.default.violationReport.update({
            where: { id },
            data: { status: 'RESOLVED' }
        });
        res.json({ message: `User @${authorUsername} suspended globally and report resolved` });
    }
    catch (error) {
        console.error('Error suspending author:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.suspendAuthorByReport = suspendAuthorByReport;
