
import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';

const generateEventId = async (): Promise<string> => {
    let id = '';
    let exists = true;
    while (exists) {
        id = Math.floor(100000 + Math.random() * 900000).toString();
        const found = await prisma.event.findUnique({ where: { id } });
        if (!found) exists = false;
    }
    return id;
};

export const createEvent = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { title, description, startTime, location, groupId, image, isPrivate } = req.body;

        const id = await generateEventId();

        const event = await prisma.event.create({
            data: {
                id,
                title,
                description,
                image,
                isPrivate: isPrivate || false,
                startTime: new Date(startTime),
                location,
                groupId: groupId || undefined,
                creatorId: userId,
                participants: {
                    create: {
                        userId,
                        status: 'GOING',
                        role: 'OWNER'
                    }
                }
            }
        });

        res.status(201).json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getEvents = async (req: AuthRequest, res: Response) => {
    try {
        const { query } = req.query;
        const userId = req.user?.userId;

        let whereClause: any = {
            startTime: {
                gte: new Date() // Future events
            },
            OR: [
                { isPrivate: false },
                userId ? { creatorId: userId } : undefined,
                userId ? { participants: { some: { userId } } } : undefined
            ].filter(Boolean)
        };

        if (query && typeof query === 'string') {
            whereClause.title = { contains: query };
        }

        const events = await prisma.event.findMany({
            where: whereClause,
            orderBy: { startTime: 'asc' },
            include: {
                _count: {
                    select: { participants: true }
                }
            }
        });

        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const joinEvent = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const { eventId, status } = req.body;

        await prisma.eventParticipant.upsert({
            where: {
                userId_eventId: {
                    userId,
                    eventId
                }
            },
            update: { status: status || 'GOING' },
            create: {
                userId,
                eventId,
                status: status || 'GOING'
            }
        });

        // Notify event owner
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { title: true, creatorId: true }
        });

        const participant = await prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, image: true }
        });

        if (event && event.creatorId !== userId) {
            await prisma.notification.create({
                data: {
                    userId: event.creatorId,
                    type: 'FOLLOW', // Re-using FOLLOW or generic BELL icon if type not defined, but BELL is default. Let's use generic message.
                    message: `${participant?.firstName} is ${status || 'GOING'} to your event "${event.title}"`,
                    link: `/events/${eventId}`,
                    imageUrl: participant?.image
                }
            });
        }

        res.status(200).json({ message: 'Updated event status' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const updateEventParticipantRole = async (req: AuthRequest, res: Response) => {
    try {
        const requesterId = req.user?.userId;
        if (!requesterId) return res.status(401).json({ message: 'Unauthorized' });

        const { eventId: eventIdBody, targetUserId, role } = req.body;
        const eventId = String(eventIdBody);

        const isGlobalAdmin = req.user?.role === 'ADMIN';

        const requesterPart = await prisma.eventParticipant.findUnique({
            where: { userId_eventId: { userId: requesterId, eventId } }
        });

        if (!isGlobalAdmin && (!requesterPart || !['OWNER', 'ADMIN'].includes(requesterPart.role))) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        await prisma.eventParticipant.update({
            where: { userId_eventId: { userId: targetUserId, eventId } },
            data: { role }
        });

        res.json({ message: 'Role updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const updateEvent = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { id } = req.params;
        const eventId = String(id);
        const { title, description, startTime, location, image, profileImage, isPrivate } = req.body;

        const isGlobalAdmin = req.user?.role === 'ADMIN';

        const isGlobalAdminOrEditor = ['ADMIN', 'EDITOR'].includes(req.user?.role || '');

        const participant = await prisma.eventParticipant.findUnique({
            where: { userId_eventId: { userId, eventId } }
        });

        if (!isGlobalAdminOrEditor && (!participant || participant.role !== 'OWNER')) {
            return res.status(403).json({ message: 'Only the owner can edit this event' });
        }

        const event = await prisma.event.update({
            where: { id: eventId },
            data: {
                title,
                description,
                startTime: startTime ? new Date(startTime) : undefined,
                location,
                image,
                profileImage,
                isPrivate
            }
        });

        res.json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const deleteEvent = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { id } = req.params;
        const eventId = String(id);

        const isGlobalAdmin = req.user?.role === 'ADMIN';

        const participant = await prisma.eventParticipant.findUnique({
            where: { userId_eventId: { userId, eventId } }
        });

        if (!isGlobalAdmin && (!participant || participant.role !== 'OWNER')) {
            return res.status(403).json({ message: 'Only the event owner can delete this event' });
        }

        // Manually delete participants first to avoid FK constraint errors if cascade is missing
        await prisma.eventParticipant.deleteMany({ where: { eventId } });

        await prisma.event.delete({ where: { id: eventId } });

        res.json({ message: 'Event deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const getEvent = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const eventId = String(id);

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                _count: {
                    select: { participants: true }
                },
                participants: {
                    where: { userId: userId || '' },
                    select: {
                        status: true,
                        role: true,
                        notificationsEnabled: true
                    }
                }
            }
        });

        if (!event) return res.status(404).json({ message: 'Event not found' });

        // If private and user not creator/participant, deny?
        // Logic: if isPrivate, and (not creator AND not in participants), deny.
        const isParticipant = event.participants.length > 0;
        const isCreator = event.creatorId === userId;

        if (event.isPrivate && !isCreator && !isParticipant) {
            // For "Unlisted" privacy, we might still allow viewing if they have the ID.
            // But if we want strict "Invite Only", we deny.
            // As per previous thought: "Private = invite only (link)". So if they have link, they see it?
            // If so, we just return it.
            // But maybe we hide sensitive details?
            // Let's assume having the ID is enough to viewing it for now.
        }

        res.json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const toggleEventNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { id } = req.params;
        const eventId = String(id);

        const participant = await prisma.eventParticipant.findUnique({
            where: { userId_eventId: { userId, eventId } }
        });

        if (!participant) {
            return res.status(404).json({ message: 'You are not participating in this event' });
        }

        const updated = await prisma.eventParticipant.update({
            where: { userId_eventId: { userId, eventId } },
            data: { notificationsEnabled: !participant.notificationsEnabled }
        });

        res.json({ message: 'Notification settings updated', enabled: updated.notificationsEnabled });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}
export const leaveEvent = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const { eventId } = req.body;

        await prisma.eventParticipant.delete({
            where: {
                userId_eventId: {
                    userId,
                    eventId
                }
            }
        });
        res.status(200).json({ message: 'Left event' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error or not participating' });
    }
}

export const inviteToEvent = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { eventId, inviteeIds } = req.body;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { title: true }
        });
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const inviter = await prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, image: true }
        });

        const notifications = inviteeIds.map((inviteeId: string) => ({
            userId: inviteeId,
            type: 'EVENT_INVITE',
            message: `${inviter?.firstName} invited you to the event "${event.title}"`,
            link: `/events/${eventId}`,
            imageUrl: inviter?.image
        }));

        await Promise.all(notifications.map((n: any) => prisma.notification.create({ data: n })));

        res.json({ message: 'Invitations sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
