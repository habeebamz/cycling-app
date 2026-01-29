"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFriends = exports.getUserFollowing = exports.getUserFollowers = exports.getUserGroups = exports.uploadProfilePhoto = exports.updateUserProfile = exports.getComparisonStats = exports.getUserProfile = exports.getUsers = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getUsers = async (req, res) => {
    try {
        const { query } = req.query;
        let whereClause = { isPublic: true };
        if (query && typeof query === 'string') {
            whereClause = {
                ...whereClause,
                OR: [
                    { username: { contains: query } },
                    { firstName: { contains: query } },
                    { lastName: { contains: query } }
                ]
            };
        }
        const users = await prisma_1.default.user.findMany({
            where: whereClause,
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                image: true,
                city: true,
                country: true
            },
            take: 20
        });
        res.json(users);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUsers = getUsers;
const getUserProfile = async (req, res) => {
    try {
        const username = req.params.username;
        const currentUserId = req.user?.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                email: true, // Fetch email so we can conditionally return it
                firstName: true,
                lastName: true,
                city: true,
                country: true,
                bikeModel: true,
                bio: true,
                image: true,
                totalDistance: true,
                longestRideDistance: true,
                isPublic: true,
                isVerified: true,
                facebook: true,
                instagram: true,
                notificationsEnabled: true,
                eventRemindersEnabled: true,
                weight: true,
                height: true,
                dob: true,
                gender: true,
                _count: {
                    select: {
                        activities: true,
                        followedBy: true, // Relation name is followedBy
                        following: true,
                    }
                }
            },
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Fetch all activity distances for this user to bucket them
        // Include minimal details for the list view
        const allActivitiesRaw = await prisma_1.default.activity.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                title: true,
                distance: true,
                startTime: true,
                duration: true,
                elevationGain: true,
                _count: {
                    select: { likes: true, comments: true }
                }
            },
            orderBy: { startTime: 'desc' }
        });
        // Remap to include counts
        const allActivities = allActivitiesRaw.map(a => ({
            ...a,
            likeCount: a._count.likes,
            commentCount: a._count.comments,
            reach: a._count.likes + a._count.comments
        }));
        // Fetch Recent Activities (Top 5)
        const recentActivitiesRaw = await prisma_1.default.activity.findMany({
            where: { userId: user.id },
            orderBy: { startTime: 'desc' },
            take: 5,
            select: {
                id: true,
                title: true,
                distance: true,
                duration: true,
                startTime: true,
                calories: true,
                gpsData: true,
                images: true,
                elevationGain: true,
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            }
        });
        const recentActivities = recentActivitiesRaw.map(a => ({
            ...a,
            likeCount: a._count.likes,
            commentCount: a._count.comments,
        }));
        // Milestones
        const milestones = {
            '25km': [], '50km': [], '100km': [], '200km': [], '300km': [],
            '400km': [], '600km': [], '1000km': [], '1200km': [], '1200km+': []
        };
        allActivities.forEach(a => {
            const d = a.distance;
            if (d >= 25)
                milestones['25km'].push(a);
            if (d >= 50)
                milestones['50km'].push(a);
            if (d >= 100)
                milestones['100km'].push(a);
            if (d >= 200)
                milestones['200km'].push(a);
            if (d >= 300)
                milestones['300km'].push(a);
            if (d >= 400)
                milestones['400km'].push(a);
            if (d >= 600)
                milestones['600km'].push(a);
            if (d >= 1000)
                milestones['1000km'].push(a);
            if (d >= 1200)
                milestones['1200km'].push(a);
            if (d > 1200)
                milestones['1200km+'].push(a);
        });
        // Highlights Logic
        let mostLiked = null;
        let mostCommented = null;
        let highestReach = null;
        let longestRide = null;
        if (allActivities.length > 0) {
            // Sort by likes
            const byLikes = [...allActivities].sort((a, b) => b.likeCount - a.likeCount);
            if (byLikes[0].likeCount > 0)
                mostLiked = byLikes[0];
            // Sort by comments
            const byComments = [...allActivities].sort((a, b) => b.commentCount - a.commentCount);
            if (byComments[0].commentCount > 0)
                mostCommented = byComments[0];
            // Sort by reach
            const byReach = [...allActivities].sort((a, b) => b.reach - a.reach);
            if (byReach[0].reach > 0)
                highestReach = byReach[0];
            // Longest Ride (already tracked in user stats, but find the activity object)
            const byDistance = [...allActivities].sort((a, b) => b.distance - a.distance);
            longestRide = byDistance[0];
        }
        const highlights = {
            mostLiked,
            mostCommented,
            highestReach,
            longestRide
        };
        // Calculate Totals
        const totalElevationGain = allActivities.reduce((sum, a) => sum + (a.elevationGain || 0), 0);
        const totalDuration = allActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
        // Check if currently following
        let isFollowing = false;
        if (currentUserId && user) {
            const follow = await prisma_1.default.follows.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: currentUserId,
                        followingId: user.id
                    }
                }
            });
            isFollowing = !!follow;
        }
        // Remap to match expected frontend interface
        const responseUser = {
            ...user,
            // Only reveal email to the owner
            email: (currentUserId === user.id) ? user.email : undefined,
            milestones,
            highlights,
            totalElevationGain,
            totalDuration,
            recentActivities,
            isFollowing,
            _count: {
                ...user._count,
                followers: user._count.followedBy
            }
        };
        res.json(responseUser);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserProfile = getUserProfile;
const getComparisonStats = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await prisma_1.default.user.findUnique({
            where: { username: String(username) },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                image: true,
                totalDistance: true,
                longestRideDistance: true,
                createdAt: true,
                _count: { select: { activities: true } }
            }
        });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const now = new Date();
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(now.getDate() - 28);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const activities = await prisma_1.default.activity.findMany({
            where: { userId: user.id },
            select: {
                distance: true,
                duration: true,
                elevationGain: true,
                startTime: true,
            }
        });
        // 4 Weeks Stats
        const recentActivities = activities.filter(a => new Date(a.startTime) >= fourWeeksAgo);
        const last4Weeks = {
            count: recentActivities.length / 4,
            distance: recentActivities.reduce((sum, a) => sum + a.distance, 0) / 4,
            elevation: recentActivities.reduce((sum, a) => sum + (a.elevationGain || 0), 0) / 4,
            duration: recentActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / 4
        };
        // Year Stats
        const yearActivities = activities.filter(a => new Date(a.startTime) >= startOfYear);
        const yearStats = {
            count: yearActivities.length,
            distance: yearActivities.reduce((sum, a) => sum + a.distance, 0),
            elevation: yearActivities.reduce((sum, a) => sum + (a.elevationGain || 0), 0),
            duration: yearActivities.reduce((sum, a) => sum + (a.duration || 0), 0)
        };
        // Best Efforts 
        const bestEfforts = {
            longestRide: user.longestRideDistance,
            biggestClimb: Math.max(0, ...activities.map(a => a.elevationGain || 0)),
            // Total elevation is sum of all activity elevation gains
            totalElevation: activities.reduce((sum, a) => sum + (a.elevationGain || 0), 0)
        };
        res.json({
            user: {
                id: user.id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                image: user.image
            },
            last4Weeks,
            yearStats,
            allTime: {
                count: user._count.activities,
                distance: user.totalDistance,
                elevation: bestEfforts.totalElevation,
                duration: activities.reduce((sum, a) => sum + (a.duration || 0), 0)
            },
            bestEfforts
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getComparisonStats = getComparisonStats;
const updateUserProfile = async (req, res) => {
    try {
        let userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const isGlobalAdmin = req.user?.role === 'ADMIN';
        if (isGlobalAdmin && req.body.targetUserId) {
            userId = req.body.targetUserId;
        }
        const { firstName, lastName, city, state, country, bikeModel, bio, isPublic, facebook, instagram, email } = req.body;
        // Also handle private fields if sent: dob, weight, height
        const { weight, height, dob, gender, notificationsEnabled, eventRemindersEnabled } = req.body;
        // Check availability if email is changing
        if (email) {
            const existing = await prisma_1.default.user.findFirst({
                where: {
                    email,
                    NOT: { id: userId }
                }
            });
            if (existing) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                email, // Update email
                firstName, lastName, city, state, country, bikeModel, bio, isPublic, facebook, instagram,
                weight: weight ? parseFloat(weight) : undefined,
                height: height ? parseFloat(height) : undefined,
                dob: dob ? new Date(dob) : undefined,
                gender,
                notificationsEnabled: notificationsEnabled !== undefined ? Boolean(notificationsEnabled) : undefined,
                eventRemindersEnabled: eventRemindersEnabled !== undefined ? Boolean(eventRemindersEnabled) : undefined
            },
            select: {
                id: true, username: true, email: true, firstName: true, lastName: true,
                city: true, state: true, country: true, bikeModel: true, bio: true,
                isPublic: true, weight: true, height: true, dob: true, gender: true,
                facebook: true, instagram: true,
                notificationsEnabled: true, eventRemindersEnabled: true
            }
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateUserProfile = updateUserProfile;
const uploadProfilePhoto = async (req, res) => {
    try {
        let userId = req.user?.userId;
        const file = req.file;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const isGlobalAdmin = req.user?.role === 'ADMIN';
        if (isGlobalAdmin && req.body.targetUserId) {
            userId = req.body.targetUserId;
        }
        if (!file)
            return res.status(400).json({ message: 'No file uploaded' });
        const imagePath = `/uploads/${file.filename}`;
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: { image: imagePath },
            select: { image: true, firstName: true, username: true }
        });
        // Notify Followers
        const followers = await prisma_1.default.follows.findMany({
            where: { followingId: userId },
            select: { followerId: true }
        });
        if (followers.length > 0) {
            const notifications = followers.map(f => ({
                userId: f.followerId,
                type: 'PHOTO',
                message: `${updatedUser.firstName} updated their profile photo`,
                link: `/cyclist/${updatedUser['username']}`, // access username from updatedUser result (select included it)
                imageUrl: updatedUser.image
            }));
            // Loop for SQLite compatibility
            await Promise.all(notifications.map(n => prisma_1.default.notification.create({ data: n })));
        }
        res.json(updatedUser);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.uploadProfilePhoto = uploadProfilePhoto;
const getUserGroups = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { role } = req.query; // Optional filter
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const whereClause = { userId };
        if (role) {
            whereClause.role = role;
        }
        const members = await prisma_1.default.groupMember.findMany({
            where: whereClause,
            include: {
                group: true
            }
        });
        const groups = members.map(m => ({ ...m.group, role: m.role, notificationsEnabled: m.notificationsEnabled }));
        res.json(groups);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserGroups = getUserGroups;
const getUserFollowers = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username || typeof username !== 'string')
            return res.status(400).json({ message: 'Invalid username' });
        const user = await prisma_1.default.user.findUnique({
            where: { username },
            select: { id: true }
        });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const followers = await prisma_1.default.follows.findMany({
            where: { followingId: user.id },
            include: {
                follower: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        image: true
                    }
                }
            }
        });
        res.json(followers.map(f => f.follower));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserFollowers = getUserFollowers;
const getUserFollowing = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username || typeof username !== 'string')
            return res.status(400).json({ message: 'Invalid username' });
        const user = await prisma_1.default.user.findUnique({
            where: { username },
            select: { id: true }
        });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const following = await prisma_1.default.follows.findMany({
            where: { followerId: user.id },
            include: {
                following: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        image: true
                    }
                }
            }
        });
        res.json(following.map(f => f.following));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserFollowing = getUserFollowing;
const getFriends = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        console.log(`Fetching connections for user ${userId}`);
        // schema.prisma:
        // followedBy: Follows[] @relation("following") -> This user is being followed
        // following:  Follows[] @relation("follower") -> This user is following others
        // Follows model:
        // follower: User @relation("follower", fields: [followerId], references: [id])
        // following: User @relation("following", fields: [followingId], references: [id])
        // People who follow Me: Follows rows where followingId == Me
        // People I follow: Follows rows where followerId == Me
        const friends = await prisma_1.default.user.findMany({
            where: {
                OR: [
                    { following: { some: { followingId: userId } } }, // User X follows Me
                    { followedBy: { some: { followerId: userId } } } // User X is followed by Me
                ]
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                image: true
            }
        });
        console.log(`Found ${friends.length} connections for ${userId}`);
        res.json(friends);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getFriends = getFriends;
