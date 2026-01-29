"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllRead = exports.markRead = exports.getNotifications = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const notifications = await prisma_1.default.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to last 50
        });
        // Get unread count
        const unreadCount = await prisma_1.default.notification.count({
            where: { userId, read: false }
        });
        res.json({ notifications, unreadCount });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getNotifications = getNotifications;
const markRead = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (typeof id !== 'string')
            return res.status(400).json({ message: 'Invalid ID' });
        await prisma_1.default.notification.update({
            where: { id },
            data: { read: true }
        });
        res.json({ message: 'Marked as read' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.markRead = markRead;
const markAllRead = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        await prisma_1.default.notification.updateMany({
            where: { userId, read: false },
            data: { read: true }
        });
        res.json({ message: 'All marked as read' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.markAllRead = markAllRead;
