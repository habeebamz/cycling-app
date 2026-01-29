import { Response } from 'express';
import prisma from '../prisma';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth.middleware';

const generateGroupId = async (): Promise<string> => {
    let id = '';
    let exists = true;
    while (exists) {
        id = Math.floor(100000 + Math.random() * 900000).toString();
        const found = await prisma.group.findUnique({ where: { id } });
        if (!found) exists = false;
    }
    return id;
};

export const createGroup = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { name, description, isPrivate, type } = req.body;

        const id = await generateGroupId();

        const group = await prisma.group.create({
            data: {
                id,
                name,
                description,
                isPrivate: isPrivate || false,
                type: type || 'GROUP',
                members: {
                    create: {
                        userId,
                        role: 'OWNER'
                    }
                }
            },
        });

        res.status(201).json(group);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getGroups = async (req: AuthRequest, res: Response) => {
    try {
        const { query } = req.query;
        const userId = req.user?.userId;

        let whereClause: any = {
            OR: [
                { isPrivate: false },
                userId ? { members: { some: { userId } } } : undefined
            ].filter(Boolean)
        };

        if (query && typeof query === 'string') {
            whereClause = {
                ...whereClause,
                name: { contains: query }
            };
        }

        const groups = await prisma.group.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: { members: true }
                }
            }
        });
        res.json(groups);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const getGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        let groupData: any = await prisma.group.findUnique({
            where: { id: String(id) },
            include: {
                _count: {
                    select: { members: true }
                }
            }
        });

        if (!groupData) return res.status(404).json({ message: 'Group not found' });

        if (userId) {
            const member = await prisma.groupMember.findUnique({
                where: { userId_groupId: { userId: String(userId), groupId: groupData.id } }
            });

            if (member && (member as any).status === 'SUSPENDED') {
                if ((member as any).banExpiresAt && new Date((member as any).banExpiresAt) > new Date()) {
                    // Still banned, but let them see the group. 
                    // Interaction will be blocked by other endpoints.
                    groupData = {
                        ...groupData,
                        isSuspended: true,
                        banExpiresAt: (member as any).banExpiresAt,
                        banAppealStatus: (member as any).banAppealStatus,
                        banAppealMessage: (member as any).banAppealMessage
                    };
                } else if ((member as any).banExpiresAt && new Date((member as any).banExpiresAt) <= new Date()) {
                    // Ban expired, reactivate
                    await prisma.groupMember.update({
                        where: { id: (member as any).id },
                        data: { status: 'ACTIVE' } as any
                    });
                } else {
                    // Permanent ban - still let them see the group (read-only)
                    groupData = {
                        ...groupData,
                        isSuspended: true,
                        banAppealStatus: (member as any).banAppealStatus,
                        banAppealMessage: (member as any).banAppealMessage
                    };
                }
            }

            if (groupData.isPrivate && (!member || (member as any).status === 'SUSPENDED') && req.user?.role !== 'ADMIN') {
                // If private, only members can see. 
                // We actually want suspended members to SEE the group (read-only)
                // So if they are a member (even suspended), they pass this check.
                if (!member) {
                    return res.status(403).json({ message: 'Private group' });
                }
            }
        } else if (groupData.isPrivate) {
            return res.status(403).json({ message: 'Private group' });
        }

        res.json(groupData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const submitBanAppeal = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params; // groupId
        const { message } = req.body;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const member = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId: String(id) } }
        });

        if (!member || (member as any).status !== 'SUSPENDED') {
            return res.status(400).json({ message: 'No active suspension found' });
        }

        await prisma.groupMember.update({
            where: { id: member.id },
            data: {
                banAppealStatus: 'PENDING',
                banAppealMessage: message
            } as any
        });

        res.json({ message: 'Appeal submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const liftGroupBan = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params; // groupId
        const { targetUserId, userId: bodyUserId } = req.body;

        const effectiveTargetId = targetUserId || bodyUserId;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (!effectiveTargetId) return res.status(400).json({ message: 'Target User ID is required' });

        // Check if requester is Admin, Manager, or Editor
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !['ADMIN', 'MANAGER', 'EDITOR'].includes(user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const member = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId: String(effectiveTargetId), groupId: String(id) } }
        });

        if (!member) return res.status(404).json({ message: 'Member not found' });

        await prisma.groupMember.update({
            where: { id: member.id },
            data: {
                status: 'ACTIVE',
                banExpiresAt: null,
                banAppealStatus: 'RESOLVED'
            } as any
        });

        res.json({ message: 'Ban lifted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const joinGroup = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const { groupId } = req.body;

        // Check if user was previously banned and ban is still active
        const existingMember = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } }
        });

        if (existingMember && (existingMember as any).status === 'SUSPENDED') {
            if ((existingMember as any).banExpiresAt && new Date((existingMember as any).banExpiresAt) > new Date()) {
                return res.status(403).json({ message: 'You are suspended from this group.' });
            }
            // If ban expired, we can allow joining (though they are already members)
            // But if they are members, we should just return success or update status
            await prisma.groupMember.update({
                where: { id: (existingMember as any).id },
                data: { status: 'ACTIVE' } as any
            });
            return res.status(200).json({ message: 'Re-activated membership' });
        }

        if (existingMember) {
            return res.status(200).json({ message: 'Already a member' });
        }

        await prisma.groupMember.create({
            data: {
                userId,
                groupId
            }
        });
        res.status(200).json({ message: 'Joined group' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const updateGroupMemberRole = async (req: AuthRequest, res: Response) => {
    try {
        const requesterId = req.user?.userId;
        if (!requesterId) return res.status(401).json({ message: 'Unauthorized' });

        const { groupId, targetUserId, role } = req.body;

        const isGlobalAdmin = req.user?.role === 'ADMIN';

        // Check permission: requester must be OWNER or ADMIN or Global ADMIN
        const requesterMember = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId: requesterId, groupId } }
        });

        if (!isGlobalAdmin && (!requesterMember || !['OWNER', 'ADMIN'].includes(requesterMember.role))) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        // Validate role hierarchy logic could go here (e.g. Admin can't promote to Owner)
        // For now allow simple assignment

        await prisma.groupMember.update({
            where: { userId_groupId: { userId: targetUserId, groupId } },
            data: { role }
        });

        res.json({ message: 'Role updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const updateGroup = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { id } = req.params;
        const groupId = String(id);
        const { name, description, isPrivate, image, profileImage } = req.body;

        const isGlobalAdmin = req.user?.role === 'ADMIN';

        const isGlobalAdminOrEditor = ['ADMIN', 'EDITOR'].includes(req.user?.role || '');

        const member = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } }
        });

        if (!isGlobalAdminOrEditor && (!member || !['OWNER', 'ADMIN'].includes(member.role))) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        const group = await prisma.group.update({
            where: { id: groupId },
            data: {
                name,
                description,
                isPrivate,
                image,
                profileImage
            }
        });

        res.json(group);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const leaveGroup = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const { groupId } = req.body;

        const deleted = await prisma.groupMember.deleteMany({
            where: {
                userId,
                groupId,
                role: 'MEMBER'
            }
        });

        if (deleted.count === 0) {
            const ownerCheck = await prisma.groupMember.findUnique({
                where: { userId_groupId: { userId, groupId } }
            });
            if (ownerCheck?.role === 'OWNER') {
                return res.status(400).json({ message: 'Owners cannot leave. Delete group or transfer ownership.' });
            }
            return res.status(404).json({ message: 'Not a member or group not found' });
        }

        res.json({ message: 'Left group' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const toggleGroupNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const { groupId } = req.body;

        const member = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } }
        });

        if (!member) return res.status(404).json({ message: 'Not a member' });

        const updated = await prisma.groupMember.update({
            where: { id: member.id },
            data: { notificationsEnabled: !member.notificationsEnabled }
        });

        res.json({ message: `Notifications ${updated.notificationsEnabled ? 'enabled' : 'disabled'}`, enabled: updated.notificationsEnabled });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};



export const deleteGroup = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const { id } = req.params;
        const groupId = String(id);

        const isGlobalAdmin = req.user?.role === 'ADMIN';

        const member = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } }
        });

        if (!isGlobalAdmin && (!member || member.role !== 'OWNER')) {
            return res.status(403).json({ message: 'Only the owner can delete this group/club' });
        }

        await prisma.group.delete({ where: { id: groupId } });

        res.json({ message: 'Group deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const generatePostId = () => {
    let id = '';
    for (let i = 0; i < 12; i++) {
        id += Math.floor(Math.random() * 10).toString();
    }
    return id;
};

export const createGroupPost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const { groupId, content, image } = req.body;

        // Check membership
        // Check membership
        const member = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } },
            include: { group: { select: { type: true, name: true } } }
        });

        const isGlobalAdmin = req.user?.role === 'ADMIN';

        let groupDetails = member?.group;

        if (!member) {
            if (!isGlobalAdmin) {
                return res.status(403).json({ message: 'Must be a member to post' });
            } else {
                // If global admin and not member, fetch group details
                const group = await prisma.group.findUnique({ where: { id: groupId }, select: { type: true, name: true } });
                if (!group) return res.status(404).json({ message: 'Group not found' });
                groupDetails = group;
            }
        }

        // Check if group is a CLUB - only the owner (creator) can post in clubs
        // Global Admins can also post
        if (groupDetails?.type === 'CLUB' && !isGlobalAdmin && member?.role !== 'OWNER') {
            return res.status(403).json({
                message: 'Only the club owner can create posts in clubs. Members can like and comment on existing posts.'
            });
        }

        const post = await prisma.post.create({
            data: {
                id: generatePostId(),
                userId,
                groupId,
                content,
                image
            },
            include: { user: { select: { firstName: true, username: true, image: true } } }
        });

        const membersToNotify = await prisma.groupMember.findMany({
            where: {
                groupId,
                userId: { not: userId },
                notificationsEnabled: true
            },
            select: { userId: true }
        });

        if (membersToNotify.length > 0 && groupDetails) {
            const groupName = groupDetails.name;
            const groupType = groupDetails.type === 'CLUB' ? 'club' : 'group';
            const baseUrl = groupDetails.type === 'CLUB' ? '/clubs' : '/groups';
            const notifications = membersToNotify.map((m: { userId: string }) => ({
                userId: m.userId,
                type: groupDetails?.type === 'CLUB' ? 'CLUB_POST' : 'GROUP_POST',
                message: `New post in ${groupName} ${groupType} by ${post.user.firstName}`,
                link: `${baseUrl}/${groupId}/post/${post.id}`,
                imageUrl: post.user.image
            }));

            await Promise.all(notifications.map((n: any) => prisma.notification.create({ data: n })));
        }

        res.status(201).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const togglePostLike = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { postId } = req.params;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const existingLike = await (prisma as any).postLike.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            }
        });

        if (existingLike) {
            await (prisma as any).postLike.delete({
                where: { id: existingLike.id }
            });
            return res.json({ liked: false });
        } else {
            await (prisma as any).postLike.create({
                data: {
                    userId,
                    postId
                }
            });

            // Notify post owner
            const post = await (prisma as any).post.findUnique({
                where: { id: postId },
                select: { userId: true, groupId: true, group: { select: { type: true } } }
            });

            const liker = await prisma.user.findUnique({
                where: { id: userId },
                select: { firstName: true, image: true }
            });

            if (post && post.userId !== userId) {
                const baseUrl = post.group.type === 'CLUB' ? '/clubs' : '/groups';
                await prisma.notification.create({
                    data: {
                        userId: post.userId,
                        type: 'POST_LIKE',
                        message: `${liker?.firstName || 'Someone'} appreciated your post`,
                        link: `${baseUrl}/${post.groupId}/post/${postId}`,
                        imageUrl: liker?.image
                    }
                });
            }

            return res.json({ liked: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const addPostComment = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { postId } = req.params;
        const { text } = req.body;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (!text) return res.status(400).json({ message: 'Text is required' });

        const comment = await (prisma as any).postComment.create({
            data: {
                userId,
                postId,
                text
            },
            include: {
                user: {
                    select: { username: true, firstName: true, lastName: true, image: true }
                }
            }
        });

        // Notify post owner
        const post = await (prisma as any).post.findUnique({
            where: { id: postId },
            select: { userId: true, groupId: true, group: { select: { type: true } } }
        });

        if (post && post.userId !== userId) {
            const baseUrl = post.group.type === 'CLUB' ? '/clubs' : '/groups';
            await prisma.notification.create({
                data: {
                    userId: post.userId,
                    type: 'POST_COMMENT',
                    message: `${comment.user.firstName} commented on your post`,
                    link: `${baseUrl}/${post.groupId}/post/${postId}`,
                    imageUrl: comment.user.image
                }
            });
        }

        res.json(comment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getPostComments = async (req: AuthRequest, res: Response) => {
    try {
        const { postId } = req.params;
        const comments = await (prisma as any).postComment.findMany({
            where: { postId },
            include: {
                user: {
                    select: { username: true, firstName: true, lastName: true, image: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateGroupPost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { postId } = req.params as { postId: string };
        const { content } = req.body;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (!content) return res.status(400).json({ message: 'Content is required' });

        const post = await prisma.post.findUnique({
            where: { id: postId }
        });

        if (!post) return res.status(404).json({ message: 'Post not found' });
        if (post.userId !== userId) return res.status(403).json({ message: 'Not authorized to edit this post' });

        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: { content },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, username: true, image: true }
                },
                _count: {
                    select: { likes: true, comments: true }
                }
            }
        });

        res.json(updatedPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteGroupPost = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { postId } = req.params as { postId: string };

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { group: { select: { id: true } } }
        });

        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Authorization: Author or Group Admin/Owner
        let canDelete = post.userId === userId;

        const isGlobalAdmin = req.user?.role === 'ADMIN';

        if (!canDelete && !isGlobalAdmin) {
            const membership = await prisma.groupMember.findUnique({
                where: {
                    userId_groupId: {
                        userId,
                        groupId: post.groupId
                    }
                }
            });
            if (membership && (membership.role === 'ADMIN' || membership.role === 'OWNER')) {
                canDelete = true;
            }
        } else if (isGlobalAdmin) {
            canDelete = true;
        }

        if (!canDelete) return res.status(403).json({ message: 'Not authorized to delete this post' });

        await prisma.post.delete({
            where: { id: postId }
        });

        res.json({ message: 'Post deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getGroupPosts = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const groupId = id as string;

        const member = userId ? await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId, groupId } }
        }) : null;

        const group = await prisma.group.findUnique({ where: { id: groupId } });

        if (group?.isPrivate && !member) {
            return res.status(403).json({ message: 'Private group' });
        }

        const posts = await prisma.post.findMany({
            where: { groupId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, username: true, image: true }
                },
                likes: {
                    where: { userId: userId || '' }
                },
                _count: {
                    select: { likes: true, comments: true }
                }
            }
        });

        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


export const getGroupLeaderboard = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const groupId = String(id);

        // Get activities for all members in this group for the current month.
        // Simplified: Fetch all members, then sum their rides.
        // Better: Use `Activity` table where user is in this group.
        // Since Activity isn't directly linked to Group, we look for activities by users who are members.

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const members = await prisma.groupMember.findMany({
            where: { groupId },
            select: { userId: true }
        });

        const memberIds = members.map(m => m.userId);

        const activities = await prisma.activity.findMany({
            where: {
                userId: { in: memberIds },
                startTime: { gte: startOfMonth }
            },
            select: {
                userId: true,
                distance: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        image: true
                    }
                }
            }
        });

        // Aggregate by user
        const leaderboardMap: Record<string, any> = {};

        activities.forEach(act => {
            if (!leaderboardMap[act.userId]) {
                leaderboardMap[act.userId] = {
                    user: act.user,
                    totalDistance: 0,
                    rideCount: 0
                };
            }
            leaderboardMap[act.userId].totalDistance += act.distance;
            leaderboardMap[act.userId].rideCount += 1;
        });

        const leaderboard = Object.values(leaderboardMap).sort((a: any, b: any) => b.totalDistance - a.totalDistance);

        res.json(leaderboard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
export const getGroupMembers = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const groupId = String(id);

        const members = await prisma.groupMember.findMany({
            where: { groupId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        image: true,
                        city: true,
                        country: true
                    }
                }
            },
            orderBy: { joinedAt: 'asc' }
        });

        res.json(members);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const inviteToGroup = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { groupId, inviteeIds } = req.body;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const group = await prisma.group.findUnique({
            where: { id: groupId },
            select: { name: true, type: true }
        });
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const inviter = await prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, image: true }
        });

        const groupType = group.type === 'CLUB' ? 'club' : 'group';
        const baseUrl = group.type === 'CLUB' ? '/clubs' : '/groups';

        const notifications = inviteeIds.map((inviteeId: string) => ({
            userId: inviteeId,
            type: group.type === 'CLUB' ? 'CLUB_INVITE' : 'GROUP_INVITE',
            message: `${inviter?.firstName} invited you to join the ${groupType} "${group.name}"`,
            link: `${baseUrl}/${groupId}`,
            imageUrl: inviter?.image
        }));

        await Promise.all(notifications.map((n: any) => prisma.notification.create({ data: n })));

        res.json({ message: 'Invitations sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
