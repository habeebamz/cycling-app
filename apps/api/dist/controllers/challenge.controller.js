"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChallengeById = exports.uploadChallengePhoto = exports.deleteChallenge = exports.updateChallenge = exports.getChallengesForUserGroups = exports.leaveChallenge = exports.joinChallenge = exports.getChallenges = exports.getGroupChallenges = exports.createChallenge = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const createChallenge = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { title, description, type, goal, startDate, endDate, groupId, condition, trophyImage, isPrivate } = req.body;
        if (!title || !type || !goal || !startDate || !endDate) {
            console.log('Missing required fields:', { title, type, goal, startDate, endDate });
            return res.status(400).json({
                message: 'Missing required fields. Please fill in all required information.'
            });
        }
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        const isAdmin = user?.role === 'ADMIN';
        if (!groupId) {
            if (!isAdmin) {
                return res.status(403).json({ message: 'Only Admins can create Global Challenges' });
            }
        }
        else {
            // Check for membership in the group
            const membership = await prisma_1.default.groupMember.findUnique({
                where: {
                    userId_groupId: {
                        userId,
                        groupId
                    }
                }
            });
            if (!membership)
                return res.status(403).json({ message: 'Not a member of this group' });
        }
        // Generate 6-digit ID
        const id = Math.floor(100000 + Math.random() * 900000).toString();
        const challenge = await prisma_1.default.challenge.create({
            data: {
                id,
                title,
                description,
                type,
                condition: condition || 'ACCUMULATIVE',
                goal: parseFloat(goal),
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                groupId: groupId || null,
                creatorId: userId,
                trophyImage,
                // @ts-ignore
                isPrivate: groupId ? (isPrivate || false) : false
            }
        });
        // Auto-join creator?
        await prisma_1.default.challengeParticipant.create({
            data: {
                userId,
                challengeId: challenge.id
            }
        });
        res.status(201).json(challenge);
    }
    catch (error) {
        console.error('Error creating challenge:', error);
        res.status(500).json({ message: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
};
exports.createChallenge = createChallenge;
const getGroupChallenges = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { groupId } = req.params;
        const groupIdStr = String(groupId);
        const challenges = await prisma_1.default.challenge.findMany({
            where: { groupId: groupIdStr },
            include: {
                _count: {
                    select: { participants: true }
                },
                participants: {
                    where: { userId: userId },
                    select: { id: true }
                }
            },
            // Also include creatorId to check ownership on frontend
            // Actually creatorId is already included by default as it's a scalar, but let's be sure no select clause excludes it.
            // (Prisma returns all scalars by default unless 'select' is used).
            // We used 'include', so scalars are returned.
        });
        res.json(challenges);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getGroupChallenges = getGroupChallenges;
const getChallenges = async (req, res) => {
    try {
        const { query } = req.query;
        let whereClause = {};
        if (query && typeof query === 'string') {
            whereClause.title = { contains: query };
        }
        // Only show challenges that haven't ended yet
        whereClause.endDate = { gte: new Date() };
        const challenges = await prisma_1.default.challenge.findMany({
            where: whereClause,
            include: {
                group: {
                    select: { name: true }
                },
                _count: {
                    select: { participants: true }
                }
            },
            orderBy: { startDate: 'asc' },
            take: 20
        });
        res.json(challenges);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getChallenges = getChallenges;
const joinChallenge = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { id } = req.params;
        const challengeId = String(id); // Ensure it's a string
        // Check if already joined
        const existing = await prisma_1.default.challengeParticipant.findUnique({
            where: { userId_challengeId: { userId, challengeId } }
        });
        if (existing)
            return res.status(400).json({ message: 'Already joined' });
        // Get challenge details to calculate initial progress
        const challenge = await prisma_1.default.challenge.findUnique({
            where: { id: challengeId }
        });
        if (!challenge)
            return res.status(404).json({ message: 'Challenge not found' });
        // Fetch user's activities within challenge window
        const activities = await prisma_1.default.activity.findMany({
            where: {
                userId,
                startTime: { gte: challenge.startDate },
                // Some activities might end after challenge ends, but we usually look at start time
                // or just activities fully within the window. 
                // Let's look at activities that STARTED within the window.
                createdAt: { lte: challenge.endDate }
            }
        });
        // Actually, to be very precise, we should probably look at activity.startTime
        // but createdAt is also a good proxy if startTime is not reliable.
        // Let's use startTime if available, otherwise createdAt.
        // Actually Activity model has startTime.
        const challengeActivities = await prisma_1.default.activity.findMany({
            where: {
                userId,
                startTime: {
                    gte: challenge.startDate,
                    lte: challenge.endDate
                }
            }
        });
        let initialProgress = 0;
        const goalInUnits = challenge.type === 'TIME' ? challenge.goal * 3600 : challenge.goal;
        if (challenge.type === 'DISTANCE') {
            if (challenge.condition === 'SINGLE') {
                const maxSingle = Math.max(0, ...challengeActivities.map(a => a.distance), 0);
                initialProgress = maxSingle >= goalInUnits ? goalInUnits : 0;
            }
            else {
                initialProgress = challengeActivities.reduce((sum, a) => sum + a.distance, 0);
            }
        }
        else if (challenge.type === 'TIME') {
            if (challenge.condition === 'SINGLE') {
                const maxSingle = Math.max(0, ...challengeActivities.map(a => a.duration), 0);
                initialProgress = maxSingle >= goalInUnits ? goalInUnits : 0;
            }
            else {
                initialProgress = challengeActivities.reduce((sum, a) => sum + a.duration, 0);
            }
        }
        else if (challenge.type === 'RIDES') {
            initialProgress = challengeActivities.length;
        }
        const isCompleted = initialProgress >= goalInUnits;
        const participant = await prisma_1.default.challengeParticipant.create({
            data: {
                userId,
                challengeId,
                progress: initialProgress,
                completed: isCompleted
            }
        });
        if (isCompleted) {
            await prisma_1.default.notification.create({
                data: {
                    userId,
                    type: 'CHALLENGE_COMPLETED',
                    message: `Congratulations! You have completed the challenge "${challenge.title}"!`,
                    link: `/dashboard/awards`,
                }
            });
        }
        res.json({ message: 'Joined challenge', progress: initialProgress, completed: isCompleted });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.joinChallenge = joinChallenge;
const leaveChallenge = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { id } = req.params;
        const challengeId = String(id);
        const deleted = await prisma_1.default.challengeParticipant.deleteMany({
            where: {
                userId,
                challengeId
            }
        });
        if (deleted.count === 0) {
            return res.status(404).json({ message: 'Not joined or challenge not found' });
        }
        res.json({ message: 'Left challenge' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.leaveChallenge = leaveChallenge;
const getChallengesForUserGroups = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        // Get groups user is a member of
        const memberships = await prisma_1.default.groupMember.findMany({
            where: { userId },
            select: { groupId: true }
        });
        const groupIds = memberships.map(m => m.groupId);
        const { completedOnly } = req.query;
        let whereClause = {
            OR: [
                { groupId: { in: groupIds } },
                { groupId: null }
            ]
        };
        if (completedOnly === 'true') {
            // For Awards: Only show completed challenges (any date)
            whereClause.participants = {
                some: {
                    userId,
                    completed: true
                }
            };
        }
        else {
            // For Dashboard: Only show challenges that haven't ended yet
            whereClause.endDate = { gte: new Date() };
        }
        const challenges = await prisma_1.default.challenge.findMany({
            where: whereClause,
            include: {
                group: {
                    select: { name: true }
                },
                _count: {
                    select: { participants: true }
                },
                participants: {
                    where: { userId },
                    select: { id: true, progress: true, completed: true }
                }
            },
            orderBy: { startDate: 'asc' }
        });
        res.json(challenges);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getChallengesForUserGroups = getChallengesForUserGroups;
const updateChallenge = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const id = req.params.id;
        const { title, description, type, goal, startDate, endDate, condition, trophyImage, isPrivate } = req.body;
        const challenge = await prisma_1.default.challenge.findUnique({
            where: { id },
            // @ts-ignore
            include: { group: { include: { members: { where: { userId } } } } }
        });
        if (!challenge)
            return res.status(404).json({ message: 'Challenge not found' });
        // Fetch User to check Global Role
        const currentUser = await prisma_1.default.user.findUnique({ where: { id: userId } });
        const isPlatformAdmin = currentUser?.role === 'ADMIN';
        // Check Group Admin/Owner
        // @ts-ignore
        const groupMembers = challenge.group?.members || [];
        const isGroupAdmin = groupMembers.length > 0 && (groupMembers[0].role === 'ADMIN' || groupMembers[0].role === 'OWNER');
        const isCreator = challenge.creatorId === userId;
        // Strict Check: Creator OR GroupAdmin OR PlatformAdmin
        if (!challenge.groupId) {
            if (!isPlatformAdmin) {
                return res.status(403).json({ message: 'Only Admins can edit Global Challenges' });
            }
        }
        else {
            if (!isCreator && !isGroupAdmin && !isPlatformAdmin) {
                return res.status(403).json({ message: 'Not authorized to edit this challenge' });
            }
        }
        const updated = await prisma_1.default.challenge.update({
            where: { id },
            data: {
                title,
                description,
                type,
                condition,
                goal: parseFloat(goal),
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                trophyImage,
                // @ts-ignore
                isPrivate: challenge.groupId ? isPrivate : false
            }
        });
        res.json(updated);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateChallenge = updateChallenge;
const deleteChallenge = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const id = req.params.id;
        const challenge = await prisma_1.default.challenge.findUnique({
            where: { id },
            // @ts-ignore
            include: { group: { include: { members: { where: { userId } } } } }
        });
        // Wait, 'Group' might be 'group' depending on schema relation name. in schema it is `group`.
        // So `include: { group: ... }` is correct.
        const challengeToCheck = await prisma_1.default.challenge.findUnique({
            where: { id },
            include: { group: { include: { members: { where: { userId } } } } }
        });
        if (!challengeToCheck)
            return res.status(404).json({ message: 'Challenge not found' });
        // Check if user is creator, group admin, or platform admin
        // @ts-ignore
        const groupMembers = challengeToCheck.group?.members || [];
        const isGroupAdmin = groupMembers.length > 0 && (groupMembers[0].role === 'ADMIN' || groupMembers[0].role === 'OWNER');
        const isCreator = challengeToCheck.creatorId === userId;
        // Fetch User to check Global Role
        const currentUser = await prisma_1.default.user.findUnique({ where: { id: userId } });
        const isPlatformAdmin = currentUser?.role === 'ADMIN';
        // If Global Challenge (no group), ONLY Platform Admin can delete
        if (!challengeToCheck.groupId) {
            if (!isPlatformAdmin) {
                return res.status(403).json({ message: 'Only Admins can delete Global Challenges' });
            }
        }
        else {
            if (!isCreator && !isGroupAdmin && !isPlatformAdmin) {
                return res.status(403).json({ message: 'Not authorized to delete this challenge' });
            }
        }
        // Delete participants first to be safe
        await prisma_1.default.challengeParticipant.deleteMany({ where: { challengeId: id } });
        await prisma_1.default.challenge.delete({ where: { id } });
        res.json({ message: 'Challenge deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteChallenge = deleteChallenge;
const uploadChallengePhoto = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const id = req.params.id;
        const file = req.file;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!file)
            return res.status(400).json({ message: 'No file uploaded' });
        const challenge = await prisma_1.default.challenge.findUnique({
            where: { id },
            include: { group: { include: { members: { where: { userId } } } } }
        });
        if (!challenge)
            return res.status(404).json({ message: 'Challenge not found' });
        // @ts-ignore
        const groupMembers = challenge.group?.members || [];
        const isCreator = challenge.creatorId === userId;
        const isAdmin = groupMembers.length > 0 && (groupMembers[0].role === 'ADMIN' || groupMembers[0].role === 'OWNER');
        const isGlobalAdmin = req.user?.role === 'ADMIN';
        if (!isCreator && !isAdmin && !isGlobalAdmin) {
            return res.status(403).json({ message: 'Not authorized to update this challenge' });
        }
        const imagePath = `/uploads/${file.filename}`;
        const updated = await prisma_1.default.challenge.update({
            where: { id },
            data: {
                // @ts-ignore
                image: imagePath
            },
            select: {
                // @ts-ignore
                image: true,
                id: true
            }
        });
        res.json(updated);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.uploadChallengePhoto = uploadChallengePhoto;
const getChallengeById = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const id = String(req.params.id);
        const challenge = await prisma_1.default.challenge.findUnique({
            where: { id },
            include: {
                group: {
                    select: { id: true, name: true, image: true }
                },
                _count: {
                    select: { participants: true }
                },
                participants: {
                    select: {
                        userId: true,
                        progress: true,
                        completed: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                                firstName: true,
                                lastName: true,
                                image: true
                            }
                        }
                    },
                    orderBy: { progress: 'desc' },
                    take: 50
                }
            }
        });
        if (!challenge)
            return res.status(404).json({ message: 'Challenge not found' });
        // challenge includes participants due to 'include', so TS should be happy if typed correctly.
        // If not, we can rely on runtime or cast. Prisma types usually handle this.
        // The previous error "Property 'participants' does not exist" suggests Prisma types might verify what's strictly returned vs what's in 'where'.
        // But 'findUnique' with 'include' returns the relation. 
        // We'll trust the successful runtime behavior but if TS complains, we can cast.
        // Check if current user is participating
        // @ts-ignore
        const userParticipant = challenge.participants?.find((p) => p.userId === userId);
        res.json({
            ...challenge,
            userProgress: userParticipant || null
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getChallengeById = getChallengeById;
