"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unfollowUser = exports.followUser = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const followUser = async (req, res) => {
    try {
        const followerId = req.user?.userId;
        const { followingId } = req.body;
        if (!followerId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (followerId === followingId)
            return res.status(400).json({ message: 'Cannot follow yourself' });
        await prisma_1.default.follows.create({
            data: {
                followerId,
                followingId,
            },
        });
        // Create Notification
        const followerUser = await prisma_1.default.user.findUnique({ where: { id: followerId } });
        await prisma_1.default.notification.create({
            data: {
                userId: followingId,
                type: 'FOLLOW',
                message: `${followerUser?.firstName || 'Someone'} started following you`,
                link: `/cyclist/${followerUser?.username}`,
                imageUrl: followerUser?.image
            },
        });
        res.status(200).json({ message: 'Followed successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error or already following' });
    }
};
exports.followUser = followUser;
const unfollowUser = async (req, res) => {
    try {
        const followerId = req.user?.userId;
        const { followingId } = req.body;
        if (!followerId)
            return res.status(401).json({ message: 'Unauthorized' });
        await prisma_1.default.follows.delete({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });
        res.status(200).json({ message: 'Unfollowed successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.unfollowUser = unfollowUser;
