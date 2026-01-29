
import { Request, Response } from 'express';
import prisma from '../prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const userCount = await prisma.user.count();
        const activityCount = await prisma.activity.count();
        const groupCount = await prisma.group.count();
        const challengeCount = await prisma.challenge.count();
        const violationCount = await prisma.violationReport.count({ where: { status: 'PENDING' } });

        // Calculate Today's Stats
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todaysActivities = await prisma.activity.findMany({
            where: {
                startTime: {
                    gte: startOfDay
                }
            },
            select: {
                distance: true,
                duration: true,
                elevationGain: true
            }
        });

        const todayStats = {
            rides: todaysActivities.length,
            distance: todaysActivities.reduce((acc, curr) => acc + curr.distance, 0),
            duration: todaysActivities.reduce((acc, curr) => acc + curr.duration, 0),
            elevation: todaysActivities.reduce((acc, curr) => acc + curr.elevationGain, 0),
        };

        // Calculate Total Stats (Aggregates)
        const totalAggregates = await prisma.activity.aggregate({
            _sum: {
                distance: true,
                duration: true,
                elevationGain: true
            }
        });

        const totalStats = {
            rides: activityCount,
            distance: totalAggregates._sum.distance || 0,
            duration: totalAggregates._sum.duration || 0,
            elevation: totalAggregates._sum.elevationGain || 0,
        };

        res.json({
            users: userCount,
            activities: activityCount,
            groups: groupCount,
            challenges: challengeCount,
            reports: violationCount,
            today: todayStats,
            total: totalStats
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                isVerified: true,
                createdAt: true,
                _count: {
                    select: { activities: true }
                }
            }
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const updateUserStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, isVerified, role } = req.body;

    if (!id) return res.status(400).json({ error: 'User ID required' });

    try {
        const updateData: any = {};
        if (status) updateData.status = status;
        if (isVerified !== undefined) updateData.isVerified = isVerified;
        if (role) {
            if (req.user?.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Only System Admins can change user roles' });
            }
            updateData.role = role;
        }

        const user = await prisma.user.update({
            where: { id: String(id) },
            data: updateData
        });

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only System Admin can delete users' });
        }

        const { id } = req.params;
        if (!id) return res.status(400).json({ error: 'User ID required' });

        const userId = String(id);

        // 1. Delete Activities
        await prisma.activity.deleteMany({ where: { userId } });

        // 2. Delete Posts (Cascades comments/likes on them)
        await prisma.post.deleteMany({ where: { userId } });
        await prisma.postLike.deleteMany({ where: { userId } });
        await prisma.postComment.deleteMany({ where: { userId } });

        // 3. Delete Violation Reports
        await prisma.violationReport.deleteMany({ where: { reporterId: userId } });

        // 4. Delete Notifications
        await prisma.notification.deleteMany({ where: { userId } });

        // 5. Delete Socials (Follows)
        await prisma.follows.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } });

        // 6. Memberships
        await prisma.eventParticipant.deleteMany({ where: { userId } });
        await prisma.challengeParticipant.deleteMany({ where: { userId } });
        await prisma.groupMember.deleteMany({ where: { userId } });

        // 7. Created Events (and their dependencies)
        const userEvents = await prisma.event.findMany({ where: { creatorId: userId }, select: { id: true } });
        const eventIds = userEvents.map(e => e.id);
        if (eventIds.length > 0) {
            await prisma.eventParticipant.deleteMany({ where: { eventId: { in: eventIds } } });
            await prisma.badge.deleteMany({ where: { eventId: { in: eventIds } } });
            await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
        }

        // 8. Created Challenges (and their dependencies)
        const userChallenges = await prisma.challenge.findMany({ where: { creatorId: userId }, select: { id: true } });
        const challengeIds = userChallenges.map(c => c.id);
        if (challengeIds.length > 0) {
            await prisma.challengeParticipant.deleteMany({ where: { challengeId: { in: challengeIds } } });
            await prisma.challenge.deleteMany({ where: { id: { in: challengeIds } } });
        }

        // 9. Delete User
        await prisma.user.delete({ where: { id: userId } });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

// --- Groups/Clubs ---

export const getAllGroups = async (req: Request, res: Response) => {
    try {
        // Group schema doesn't have a direct 'creator' relation in the View I saw?
        // Wait, schema has 'members'. I'll skip complex includes to be safe for now, primarily just finding many.
        const groups = await prisma.group.findMany({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { members: true } } }
        });
        res.json(groups);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
};

export const updateGroupStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, isVerified } = req.body;
    try {
        const updateData: any = {};
        if (status) updateData.status = status;
        if (isVerified !== undefined) updateData.isVerified = isVerified;

        await prisma.group.update({ where: { id: String(id) }, data: updateData });
        res.json({ message: 'Group updated' });
    } catch (e) {
        res.status(500).json({ error: 'Update failed' });
    }
};

export const deleteGroup = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only System Admin can delete groups' });
        }
        // 1. Delete Group Events and dependencies
        const groupEvents = await prisma.event.findMany({ where: { groupId: String(id) }, select: { id: true } });
        const eventIds = groupEvents.map(e => e.id);
        if (eventIds.length > 0) {
            await prisma.eventParticipant.deleteMany({ where: { eventId: { in: eventIds } } });
            await prisma.badge.deleteMany({ where: { eventId: { in: eventIds } } });
            await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
        }

        // 2. Delete Group Challenges and dependencies
        const groupChallenges = await prisma.challenge.findMany({ where: { groupId: String(id) }, select: { id: true } });
        const challengeIds = groupChallenges.map(c => c.id);
        if (challengeIds.length > 0) {
            await prisma.challengeParticipant.deleteMany({ where: { challengeId: { in: challengeIds } } });
            await prisma.challenge.deleteMany({ where: { id: { in: challengeIds } } });
        }

        // 3. Delete Group Posts (Cascades Comments, Likes, Reports)
        await prisma.post.deleteMany({ where: { groupId: String(id) } });

        // 4. Delete Group Members
        await prisma.groupMember.deleteMany({ where: { groupId: String(id) } });

        // 5. Delete Group
        await prisma.group.delete({ where: { id: String(id) } });
        res.json({ message: 'Group deleted' });
    } catch (e) {
        res.status(500).json({ error: 'Delete failed' });
    }
};

// --- Activities ---

export const getAllActivities = async (req: Request, res: Response) => {
    try {
        const activities = await prisma.activity.findMany({
            take: 100, // Limit to 100 for performance
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { username: true, email: true } } }
        });
        res.json(activities);
    } catch (e) {
        res.status(500).json({ error: 'Fetch failed' });
    }
};

export const deleteActivity = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only System Admin can delete activities' });
        }
        await prisma.activity.delete({ where: { id: String(id) } });
        res.json({ message: 'Activity deleted' });
    } catch (e) {
        res.status(500).json({ error: 'Delete failed' });
    }
};

// --- Events ---

export const getAllEvents = async (req: Request, res: Response) => {
    try {
        const events = await prisma.event.findMany({
            orderBy: { createdAt: 'desc' },
            include: { creator: { select: { username: true } }, group: { select: { name: true } } }
        });
        res.json(events);
    } catch (e) {
        res.status(500).json({ error: 'Fetch failed' });
    }
};

export const updateEventStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await prisma.event.update({ where: { id: String(id) }, data: { status } });
        res.json({ message: 'Event updated' });
    } catch (e) {
        res.status(500).json({ error: 'Update failed' });
    }
};

export const deleteEvent = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only System Admin can delete events' });
        }
        await prisma.eventParticipant.deleteMany({ where: { eventId: String(id) } });
        await prisma.event.delete({ where: { id: String(id) } });
        res.json({ message: 'Event deleted' });
    } catch (e) {
        res.status(500).json({ error: 'Delete failed' });
    }
};

export const getEmailSettings = async (req: Request, res: Response) => {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: {
                    in: [
                        'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM',
                        'TEMPLATE_WELCOME_SUBJECT', 'TEMPLATE_WELCOME_BODY',
                        'TEMPLATE_RESET_PASSWORD_SUBJECT', 'TEMPLATE_RESET_PASSWORD_BODY',
                        'TEMPLATE_RESET_SUCCESS_SUBJECT', 'TEMPLATE_RESET_SUCCESS_BODY',
                        'TEMPLATE_MONTHLY_REPORT_SUBJECT', 'TEMPLATE_MONTHLY_REPORT_BODY'
                    ]
                }
            }
        });

        const config: Record<string, string> = {
            SMTP_HOST: '',
            SMTP_PORT: '',
            SMTP_USER: '',
            SMTP_PASS: '',
            SMTP_FROM: '',
            TEMPLATE_WELCOME_SUBJECT: '',
            TEMPLATE_WELCOME_BODY: '',
            TEMPLATE_RESET_PASSWORD_SUBJECT: '',
            TEMPLATE_RESET_PASSWORD_BODY: '',
            TEMPLATE_RESET_SUCCESS_SUBJECT: '',
            TEMPLATE_RESET_SUCCESS_BODY: '',
            TEMPLATE_MONTHLY_REPORT_SUBJECT: '',
            TEMPLATE_MONTHLY_REPORT_BODY: ''
        };

        settings.forEach(s => {
            config[(s as any).key] = (s as any).value;
        });

        res.json(config);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

export const updateEmailSettings = async (req: Request, res: Response) => {
    try {
        const settings = req.body;

        const upserts = Object.entries(settings).map(([key, value]) => {
            return prisma.systemSetting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) }
            });
        });

        await Promise.all(upserts);

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
};
