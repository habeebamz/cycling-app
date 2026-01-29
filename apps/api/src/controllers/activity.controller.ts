import { Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';

import { DOMParser } from '@xmldom/xmldom';
// @ts-ignore
import togeojson from 'togeojson';
import fs from 'fs';

// Simple METs lookup based on speed (km/h)
const getMETs = (speed: number): number => {
    if (speed < 16) return 4.0;
    if (speed < 19) return 6.8;
    if (speed < 22) return 8.0;
    if (speed < 25) return 10.0;
    return 12.0;
};

export const createActivity = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const {
            title,
            description,
            distance, // km
            duration, // seconds
            avgHeartRate,
            maxHeartRate,
            gpsData,
            source,
        } = req.body;

        // Fetch user for weight/height/stats
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // 1. Calculate Stats
        const speed = distance / (duration / 3600); // km/h
        const weight = user.weight || 75; // Default 75kg if not set
        const mets = getMETs(speed);

        // Calorie Calc: Calories = MET * Weight(kg) * Time(hours)
        let calories = req.body.calories;
        if (!calories) {
            calories = mets * weight * (duration / 3600);
        }

        // Power Calc (Rough Estimate if missing): P = (Calories * 4.184) / (Time * 3.6) -> Very rough validation
        // Better to just leave null or Use a physics formula v^3.
        // We'll leave avgPower null if not provided, or estimated strictly.
        let avgPower = req.body.avgPower;

        // 2. Personal Best Logic
        let isPersonalBest = false;
        if (distance > user.longestRideDistance) {
            isPersonalBest = true;
            // Update User Record
            const updateData: any = { longestRideDistance: distance };

            // Also update Stats total distance
            updateData.totalDistance = { increment: distance };

            await prisma.user.update({
                where: { id: userId },
                data: updateData,
            });

            // Create Notification
            await prisma.notification.create({
                data: {
                    userId,
                    type: 'NEW_RECORD',
                    message: `Congratulations! You set a new personal record: ${distance}km!`,
                },
            });
        } else {
            await prisma.user.update({
                where: { id: userId },
                data: { totalDistance: { increment: distance } },
            });
        }

        const activityTitle = title || `Ride on ${new Date().toLocaleDateString()}`;

        // 3. Create Activity
        const activity = await prisma.activity.create({
            data: {
                userId,
                title: activityTitle,
                description,
                distance,
                duration,
                calories,
                avgPower,
                avgHeartRate,
                maxHeartRate,
                gpsData: gpsData ? JSON.stringify(gpsData) : undefined,
                source: source || 'manual',
                isPersonalBest,
                startTime: new Date(),
                endTime: new Date(Date.now() + duration * 1000),
            },
        });

        // 4. Update Challenges
        await updateUserChallenges(userId, activity);

        // Notify Followers
        const followers = await prisma.follows.findMany({
            where: { followingId: userId },
            select: { followerId: true }
        });

        if (followers.length > 0) {
            const notifications = followers.map(f => ({
                userId: f.followerId,
                type: 'ACTIVITY',
                message: `${user.firstName} uploaded a new activity: "${activity.title}"`,
                link: `/dashboard/activities/${activity.id}`,
                imageUrl: user.image
            }));

            await Promise.all(notifications.map(n => prisma.notification.create({ data: n })));
        }

        res.status(201).json({ ...activity, isNewRecord: isPersonalBest });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getActivities = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { username } = req.query; // Optional filter by username

        let whereClause: any = {};

        if (username) {
            const user = await prisma.user.findUnique({ where: { username: String(username) } });
            if (!user) return res.status(404).json({ message: 'User not found' });
            whereClause.userId = user.id;
        } else {
            // Default: Get feed (own + following)
            if (userId) {
                const following = await prisma.follows.findMany({
                    where: { followerId: userId },
                    select: { followingId: true }
                });
                const followingIds = following.map(f => f.followingId);
                // Include own and following
                whereClause.userId = { in: [userId, ...followingIds] };
            }
        }

        const activities = await prisma.activity.findMany({
            where: whereClause,
            include: {
                user: {
                    select: { username: true, firstName: true, lastName: true, image: true, isPublic: true }
                },
                _count: {
                    select: { likes: true, comments: true }
                },
                likes: {
                    where: { userId: userId || '' },
                    select: { userId: true }
                }
            } as any, // Cast to any to avoid Prisma/TS mismatch errors temporarily
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        // Transform to add hasLiked boolean
        const activitiesWithLikeStatus = activities.map((activity: any) => ({
            ...activity,
            hasLiked: activity.likes.length > 0,
            likes: undefined, // remove the array
            likeCount: activity._count.likes,
            commentCount: activity._count.comments
        }));

        res.json(activitiesWithLikeStatus);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getActivity = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params as { id: string };

        const activity = await prisma.activity.findUnique({
            where: { id },
            include: {
                user: {
                    select: { username: true, firstName: true, lastName: true, image: true }
                }
            }
        });

        if (!activity) return res.status(404).json({ message: 'Activity not found' });

        // Privacy check (if needed later), currently assuming open or self
        // if (activity.user.isPrivate && activity.userId !== userId) ...

        res.json(activity);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const deleteActivity = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params as { id: string };

        const activity = await prisma.activity.findUnique({ where: { id } });

        if (!activity) return res.status(404).json({ message: 'Activity not found' });
        if (activity.userId !== userId) return res.status(403).json({ message: 'Unauthorized' });

        await prisma.activity.delete({ where: { id } });

        // Update user stats (decrement distance)
        await prisma.user.update({
            where: { id: userId },
            data: { totalDistance: { decrement: activity.distance } }
        });

        res.json({ message: 'Activity deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const uploadActivityPhotos = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params as { id: string };
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) return res.status(400).json({ message: 'No files uploaded' });

        const activity = await prisma.activity.findUnique({ where: { id } });
        if (!activity) return res.status(404).json({ message: 'Activity not found' });
        if (activity.userId !== userId) return res.status(403).json({ message: 'Unauthorized' });

        // Get existing images
        let images: string[] = [];
        if (activity.images) {
            try {
                images = JSON.parse(activity.images);
            } catch (e) {
                images = [];
            }
        }

        // Add new images (paths)
        // Assuming we serve static files from /uploads
        const newImages = files.map(file => `/uploads/${file.filename}`);
        images = [...images, ...newImages];

        const updatedActivity = await prisma.activity.update({
            where: { id },
            data: { images: JSON.stringify(images) }
        });

        res.json(updatedActivity);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteActivityPhoto = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id, photoIndex } = req.params as { id: string; photoIndex: string };

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const activity = await prisma.activity.findUnique({ where: { id } });
        if (!activity) return res.status(404).json({ message: 'Activity not found' });
        if (activity.userId !== userId) return res.status(403).json({ message: 'Unauthorized' });

        // Get existing images
        let images: string[] = [];
        if (activity.images) {
            try {
                images = JSON.parse(activity.images);
            } catch (e) {
                return res.status(400).json({ message: 'Invalid images data' });
            }
        }

        const index = parseInt(photoIndex, 10);
        if (isNaN(index) || index < 0 || index >= images.length) {
            return res.status(400).json({ message: 'Invalid photo index' });
        }

        // Remove photo from array
        const photoPath = images[index];
        images.splice(index, 1);

        // Update activity
        const updatedActivity = await prisma.activity.update({
            where: { id },
            data: { images: JSON.stringify(images) }
        });

        // Optionally delete the physical file from disk
        try {
            const fullPath = `./uploads${photoPath.replace('/uploads', '')}`;
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        } catch (fileError) {
            console.error('Failed to delete physical file:', fileError);
            // Continue anyway - database updated
        }

        res.json(updatedActivity);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
    // Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// @ts-ignore
import FitParser from 'fit-file-parser';

export const uploadActivityFile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const file = req.file;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (!file) return res.status(400).json({ message: 'No file uploaded' });

        const ext = file.originalname.split('.').pop()?.toLowerCase();
        console.log(`[Activity Upload] Processing ${ext} file for user ${userId}`);

        let totalDistance = 0;
        let elevationGain = 0;
        let startTime = new Date();
        let endTime = new Date();
        let duration = 0;
        let geoJson: any = null;
        let source = 'file_upload';

        if (ext === 'gpx') {
            source = 'gpx_upload';
            const gpxContent = fs.readFileSync(file.path, 'utf8');
            const gpxDoc = new DOMParser().parseFromString(gpxContent, 'text/xml');
            geoJson = togeojson.gpx(gpxDoc);

            const trackFeature = geoJson.features?.find((f: any) => f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString');
            if (!trackFeature) {
                console.warn('[Activity Upload] No track feature found in GPX');
                fs.unlinkSync(file.path);
                return res.status(400).json({ message: 'No track data found in GPX file' });
            }

            const coords = trackFeature.geometry.coordinates;
            const times = trackFeature.properties?.coordTimes;
            if (coords && coords.length > 1) {
                for (let i = 0; i < coords.length - 1; i++) {
                    totalDistance += calculateDistance(coords[i], coords[i + 1]);
                    const ele1 = coords[i][2] || 0;
                    const ele2 = coords[i + 1][2] || 0;
                    if (ele2 > ele1) elevationGain += (ele2 - ele1);
                }
            } else {
                console.warn('[Activity Upload] Insufficient coordinates in GPX');
            }

            if (times && times.length > 0) {
                startTime = new Date(times[0]);
                endTime = new Date(times[times.length - 1]);
                duration = (endTime.getTime() - startTime.getTime()) / 1000;
            } else {
                duration = 3600; // Default 1 hour if no timestamps
            }

        } else if (ext === 'tcx') {
            // ... (TCX logic remains similar but add checks if needed)
            source = 'tcx_upload';
            const tcxContent = fs.readFileSync(file.path, 'utf8');
            const tcxDoc = new DOMParser().parseFromString(tcxContent, 'text/xml');
            const trackpoints = tcxDoc.getElementsByTagName('Trackpoint');

            if (trackpoints.length < 2) {
                fs.unlinkSync(file.path);
                return res.status(400).json({ message: 'Insufficient data in TCX file' });
            }

            // Existing TCX logic...
            const coords: any[] = [];
            let lastEle = -9999;

            for (let i = 0; i < trackpoints.length; i++) {
                const tp = trackpoints[i];
                const position = tp.getElementsByTagName('Position')[0];
                const altTag = tp.getElementsByTagName('AltitudeMeters')[0];

                if (position) {
                    const lat = parseFloat(position.getElementsByTagName('LatitudeDegrees')[0].textContent || '0');
                    const lon = parseFloat(position.getElementsByTagName('LongitudeDegrees')[0].textContent || '0');
                    const ele = altTag ? parseFloat(altTag.textContent || '0') : 0;

                    if (lat !== 0 || lon !== 0) {
                        coords.push([lon, lat, ele]);
                        if (lastEle !== -9999 && ele > lastEle) {
                            const gain = ele - lastEle;
                            if (gain > 0.5) elevationGain += gain;
                        }
                        lastEle = ele;
                    }
                }
            }

            geoJson = {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    properties: { name: file.originalname },
                    geometry: { type: 'LineString', coordinates: coords }
                }]
            };

            if (coords.length > 1) {
                for (let i = 0; i < coords.length - 1; i++) {
                    totalDistance += calculateDistance(coords[i], coords[i + 1]);
                }
            }

            if (trackpoints.length > 1) {
                const firstTimeStr = trackpoints[0].getElementsByTagName('Time')[0]?.textContent;
                const lastTimeStr = trackpoints[trackpoints.length - 1].getElementsByTagName('Time')[0]?.textContent;
                if (firstTimeStr && lastTimeStr) {
                    startTime = new Date(firstTimeStr);
                    const lastTime = new Date(lastTimeStr);
                    duration = (lastTime.getTime() - startTime.getTime()) / 1000;
                }
            }
        } else if (ext === 'fit') {
            // Existing FIT logic...
            source = 'fit_upload';
            const fileContent = fs.readFileSync(file.path);
            const fitParser = new FitParser({ force: true, speedUnit: 'km/h', lengthUnit: 'km', mode: 'list' });

            await new Promise((resolve, reject) => {
                fitParser.parse(fileContent, (error: any, data: any) => {
                    if (error) reject(error);
                    else {
                        if (data.sessions && data.sessions.length > 0) {
                            const session = data.sessions[0];
                            totalDistance = session.total_distance || 0;
                            duration = session.total_elapsed_time || 0;
                            elevationGain = session.total_ascent || 0;
                            startTime = new Date(session.start_time);
                        }
                        const coords: any[] = [];
                        if (data.records) {
                            for (const rec of data.records) {
                                if (rec.position_lat && rec.position_long) {
                                    coords.push([rec.position_long, rec.position_lat, rec.altitude || 0]);
                                }
                            }
                        }
                        geoJson = {
                            type: 'FeatureCollection',
                            features: [{
                                type: 'Feature',
                                properties: { name: file.originalname },
                                geometry: { type: 'LineString', coordinates: coords }
                            }]
                        };
                        if (totalDistance === 0 && coords.length > 1) {
                            for (let i = 0; i < coords.length - 1; i++) {
                                totalDistance += calculateDistance(coords[i] as any, coords[i + 1] as any);
                            }
                        }
                        resolve(true);
                    }
                });
            });
        } else {
            fs.unlinkSync(file.path);
            return res.status(400).json({ message: 'Unsupported file format.' });
        }

        // Final cleanup and DB update
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const speed = duration > 0 ? totalDistance / (duration / 3600) : 0;
        const weight = user.weight || 75;
        const mets = getMETs(speed);
        const calories = req.body.calories ? parseFloat(req.body.calories) : mets * weight * (duration / 3600);

        let isPersonalBest = false;
        if (totalDistance > (user.longestRideDistance || 0)) {
            isPersonalBest = true;
            await prisma.user.update({
                where: { id: userId },
                data: {
                    longestRideDistance: totalDistance,
                    totalDistance: { increment: totalDistance }
                }
            });
            await prisma.notification.create({
                data: {
                    userId,
                    type: 'NEW_RECORD',
                    message: `Congratulations! You set a new personal record: ${totalDistance.toFixed(2)}km!`,
                },
            });
        } else {
            await prisma.user.update({
                where: { id: userId },
                data: { totalDistance: { increment: totalDistance } }
            });
        }

        const activity = await prisma.activity.create({
            data: {
                userId,
                title: req.body.title || `Imported ${ext?.toUpperCase()} Ride`,
                description: req.body.description || `Imported from ${file.originalname}`,
                distance: parseFloat(totalDistance.toFixed(2)),
                duration,
                calories: Math.round(calories),
                elevationGain: parseFloat(elevationGain.toFixed(1)),
                gpsData: JSON.stringify(geoJson),
                source: source,
                isPersonalBest,
                startTime,
                endTime: new Date(startTime.getTime() + duration * 1000)
            }
        });

        await updateUserChallenges(userId, activity);
        console.log(`[Activity Upload] Successfully created activity ${activity.id} for user ${userId}`);
        res.json(activity);

    } catch (error) {
        console.error('[Activity Upload Error]:', error);
        res.status(500).json({ message: 'Server error processing file' });
    }
};

export const updateActivity = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params as { id: string };
        const { title, description } = req.body;

        const activity = await prisma.activity.findUnique({ where: { id } });

        if (!activity) return res.status(404).json({ message: 'Activity not found' });
        if (activity.userId !== userId) return res.status(403).json({ message: 'Unauthorized' });

        const updated = await prisma.activity.update({
            where: { id },
            data: {
                title,
                description
            }
        });

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper to update challenges
const updateUserChallenges = async (userId: string, activity: any) => {
    try {
        const activeChallenges = await prisma.challengeParticipant.findMany({
            where: {
                userId,
                completed: false,
                challenge: {
                    startDate: { lte: new Date() },
                    endDate: { gte: new Date() }
                }
            },
            include: { challenge: true }
        });

        for (const participant of activeChallenges) {
            const challenge = participant.challenge;
            let progressIncrement = 0;

            if (challenge.type === 'DISTANCE') {
                progressIncrement = activity.distance;
            } else if (challenge.type === 'TIME') {
                progressIncrement = activity.duration; // seconds
            } else if (challenge.type === 'RIDES') {
                progressIncrement = 1;
            }

            if (progressIncrement > 0) {
                // @ts-ignore
                const isSingle = challenge.condition === 'SINGLE';
                const goalInUnits = challenge.type === 'TIME' ? challenge.goal * 3600 : challenge.goal;

                let newProgress = participant.progress;
                let isCompleted = false;

                if (isSingle) {
                    // Progress stays at 0 until the goal is met in ONE ride as requested by user.
                    // If target is met, progress jumps to goal and marked as completed.
                    if (progressIncrement >= goalInUnits) {
                        newProgress = goalInUnits;
                        isCompleted = true;
                    } else {
                        // Stay at whatever was previously record high or 0
                        // actually user said progress should be 0 unless target is met.
                        newProgress = 0;
                    }
                    if (participant.completed) {
                        isCompleted = true; // Keep true if already done
                        newProgress = goalInUnits;
                    }
                } else {
                    // ACCUMULATIVE
                    newProgress = participant.progress + progressIncrement;
                    if (newProgress >= goalInUnits) {
                        isCompleted = true;
                    }
                }

                if (newProgress !== participant.progress || isCompleted !== participant.completed) {
                    await prisma.challengeParticipant.update({
                        where: { id: participant.id },
                        data: {
                            progress: newProgress,
                            completed: isCompleted
                        }
                    });

                    if (isCompleted && !participant.completed) {
                        await prisma.notification.create({
                            data: {
                                userId,
                                type: 'CHALLENGE_COMPLETED',
                                message: `Congratulations! You have completed the challenge "${challenge.title}"!`,
                                link: `/dashboard/awards`,
                            }
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error updating challenges:', error);
    }
};

export const toggleLike = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const existingLike = await (prisma as any).activityLike.findUnique({
            where: {
                userId_activityId: {
                    userId,
                    activityId: id
                }
            }
        });

        if (existingLike) {
            await (prisma as any).activityLike.delete({
                where: { id: existingLike.id }
            });
            return res.json({ liked: false });
        } else {
            await (prisma as any).activityLike.create({
                data: {
                    userId,
                    activityId: id
                }
            });

            // Notify activity owner
            const activity = await prisma.activity.findUnique({
                where: { id: String(id) },
                select: { userId: true, title: true }
            });

            const liker = await prisma.user.findUnique({
                where: { id: userId },
                select: { firstName: true, image: true }
            });

            if (activity && activity.userId !== userId) {
                await prisma.notification.create({
                    data: {
                        userId: activity.userId,
                        type: 'LIKE',
                        message: `${liker?.firstName || 'Someone'} liked your ride "${activity.title}"`,
                        link: `/dashboard/activities/${id}`,
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

export const addComment = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { text } = req.body;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (!text) return res.status(400).json({ message: 'Text is required' });

        const comment = await (prisma as any).activityComment.create({
            data: {
                userId,
                activityId: id,
                text
            },
            include: {
                user: {
                    select: { username: true, firstName: true, lastName: true, image: true }
                }
            }
        });

        // Notify activity owner
        const activity = await prisma.activity.findUnique({
            where: { id: String(id) },
            select: { userId: true, title: true }
        });

        if (activity && activity.userId !== userId) {
            await prisma.notification.create({
                data: {
                    userId: activity.userId,
                    type: 'COMMENT',
                    message: `${comment.user.firstName} commented on your ride "${activity.title}"`,
                    link: `/dashboard/activities/${id}`,
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

export const getComments = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const comments = await (prisma as any).activityComment.findMany({
            where: { activityId: id },
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

export const getActivityLikes = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const likes = await (prisma as any).activityLike.findMany({
            where: { activityId: id },
            include: {
                user: {
                    select: { id: true, username: true, firstName: true, lastName: true, image: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const likers = likes.map((like: any) => like.user);
        res.json(likers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
