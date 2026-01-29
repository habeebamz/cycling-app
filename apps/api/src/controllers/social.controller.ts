import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const followUser = async (req: AuthRequest, res: Response) => {
    try {
        const followerId = req.user?.userId;
        const { followingId } = req.body;

        if (!followerId) return res.status(401).json({ message: 'Unauthorized' });
        if (followerId === followingId) return res.status(400).json({ message: 'Cannot follow yourself' });

        await prisma.follows.create({
            data: {
                followerId,
                followingId,
            },
        });

        // Create Notification
        const followerUser = await prisma.user.findUnique({ where: { id: followerId } });
        await prisma.notification.create({
            data: {
                userId: followingId,
                type: 'FOLLOW',
                message: `${followerUser?.firstName || 'Someone'} started following you`,
                link: `/cyclist/${followerUser?.username}`,
                imageUrl: followerUser?.image
            },
        });

        res.status(200).json({ message: 'Followed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error or already following' });
    }
};

export const unfollowUser = async (req: AuthRequest, res: Response) => {
    try {
        const followerId = req.user?.userId;
        const { followingId } = req.body;

        if (!followerId) return res.status(401).json({ message: 'Unauthorized' });

        await prisma.follows.delete({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        res.status(200).json({ message: 'Unfollowed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
