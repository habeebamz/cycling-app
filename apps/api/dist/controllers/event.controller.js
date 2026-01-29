"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteToEvent = exports.leaveEvent = exports.toggleEventNotifications = exports.getEvent = exports.deleteEvent = exports.updateEvent = exports.updateEventParticipantRole = exports.joinEvent = exports.getEvents = exports.createEvent = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const generateEventId = async () => {
    let id = '';
    let exists = true;
    while (exists) {
        id = Math.floor(100000 + Math.random() * 900000).toString();
        const found = await prisma_1.default.event.findUnique({ where: { id } });
        if (!found)
            exists = false;
    }
    return id;
};
const createEvent = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { title, description, startTime, location, groupId, image, isPrivate } = req.body;
        const id = await generateEventId();
        const event = await prisma_1.default.event.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createEvent = createEvent;
const getEvents = async (req, res) => {
    try {
        const { query } = req.query;
        const userId = req.user?.userId;
        let whereClause = {
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
        const events = await prisma_1.default.event.findMany({
            where: whereClause,
            orderBy: { startTime: 'asc' },
            include: {
                _count: {
                    select: { participants: true }
                }
            }
        });
        res.json(events);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getEvents = getEvents;
const joinEvent = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { eventId, status } = req.body;
        await prisma_1.default.eventParticipant.upsert({
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
        const event = await prisma_1.default.event.findUnique({
            where: { id: eventId },
            select: { title: true, creatorId: true }
        });
        const participant = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { firstName: true, image: true }
        });
        if (event && event.creatorId !== userId) {
            await prisma_1.default.notification.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.joinEvent = joinEvent;
const updateEventParticipantRole = async (req, res) => {
    try {
        const requesterId = req.user?.userId;
        if (!requesterId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { eventId: eventIdBody, targetUserId, role } = req.body;
        const eventId = String(eventIdBody);
        const isGlobalAdmin = req.user?.role === 'ADMIN';
        const requesterPart = await prisma_1.default.eventParticipant.findUnique({
            where: { userId_eventId: { userId: requesterId, eventId } }
        });
        if (!isGlobalAdmin && (!requesterPart || !['OWNER', 'ADMIN'].includes(requesterPart.role))) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        await prisma_1.default.eventParticipant.update({
            where: { userId_eventId: { userId: targetUserId, eventId } },
            data: { role }
        });
        res.json({ message: 'Role updated' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateEventParticipantRole = updateEventParticipantRole;
const updateEvent = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { id } = req.params;
        const eventId = String(id);
        const { title, description, startTime, location, image, profileImage, isPrivate } = req.body;
        const isGlobalAdmin = req.user?.role === 'ADMIN';
        const isGlobalAdminOrEditor = ['ADMIN', 'EDITOR'].includes(req.user?.role || '');
        const participant = await prisma_1.default.eventParticipant.findUnique({
            where: { userId_eventId: { userId, eventId } }
        });
        if (!isGlobalAdminOrEditor && (!participant || participant.role !== 'OWNER')) {
            return res.status(403).json({ message: 'Only the owner can edit this event' });
        }
        const event = await prisma_1.default.event.update({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateEvent = updateEvent;
const deleteEvent = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { id } = req.params;
        const eventId = String(id);
        const isGlobalAdmin = req.user?.role === 'ADMIN';
        const participant = await prisma_1.default.eventParticipant.findUnique({
            where: { userId_eventId: { userId, eventId } }
        });
        if (!isGlobalAdmin && (!participant || participant.role !== 'OWNER')) {
            return res.status(403).json({ message: 'Only the event owner can delete this event' });
        }
        // Manually delete participants first to avoid FK constraint errors if cascade is missing
        await prisma_1.default.eventParticipant.deleteMany({ where: { eventId } });
        await prisma_1.default.event.delete({ where: { id: eventId } });
        res.json({ message: 'Event deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteEvent = deleteEvent;
const getEvent = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const eventId = String(id);
        const event = await prisma_1.default.event.findUnique({
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
        if (!event)
            return res.status(404).json({ message: 'Event not found' });
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getEvent = getEvent;
const toggleEventNotifications = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { id } = req.params;
        const eventId = String(id);
        const participant = await prisma_1.default.eventParticipant.findUnique({
            where: { userId_eventId: { userId, eventId } }
        });
        if (!participant) {
            return res.status(404).json({ message: 'You are not participating in this event' });
        }
        const updated = await prisma_1.default.eventParticipant.update({
            where: { userId_eventId: { userId, eventId } },
            data: { notificationsEnabled: !participant.notificationsEnabled }
        });
        res.json({ message: 'Notification settings updated', enabled: updated.notificationsEnabled });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.toggleEventNotifications = toggleEventNotifications;
const leaveEvent = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { eventId } = req.body;
        await prisma_1.default.eventParticipant.delete({
            where: {
                userId_eventId: {
                    userId,
                    eventId
                }
            }
        });
        res.status(200).json({ message: 'Left event' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error or not participating' });
    }
};
exports.leaveEvent = leaveEvent;
const inviteToEvent = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { eventId, inviteeIds } = req.body;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const event = await prisma_1.default.event.findUnique({
            where: { id: eventId },
            select: { title: true }
        });
        if (!event)
            return res.status(404).json({ message: 'Event not found' });
        const inviter = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { firstName: true, image: true }
        });
        const notifications = inviteeIds.map((inviteeId) => ({
            userId: inviteeId,
            type: 'EVENT_INVITE',
            message: `${inviter?.firstName} invited you to the event "${event.title}"`,
            link: `/events/${eventId}`,
            imageUrl: inviter?.image
        }));
        await Promise.all(notifications.map((n) => prisma_1.default.notification.create({ data: n })));
        res.json({ message: 'Invitations sent' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.inviteToEvent = inviteToEvent;
