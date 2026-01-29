
import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to last 50
        });

        // Get unread count
        const unreadCount = await prisma.notification.count({
            where: { userId, read: false }
        });

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const markRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (typeof id !== 'string') return res.status(400).json({ message: 'Invalid ID' });

        await prisma.notification.update({
            where: { id },
            data: { read: true }
        });

        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const markAllRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });

        res.json({ message: 'All marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
