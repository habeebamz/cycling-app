"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityLikes = exports.getComments = exports.addComment = exports.toggleLike = exports.updateActivity = exports.uploadActivityFile = exports.deleteActivityPhoto = exports.uploadActivityPhotos = exports.deleteActivity = exports.getActivity = exports.getActivities = exports.createActivity = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const xmldom_1 = require("@xmldom/xmldom");
// @ts-ignore
const togeojson_1 = __importDefault(require("togeojson"));
const fs_1 = __importDefault(require("fs"));
// Simple METs lookup based on speed (km/h)
const getMETs = (speed) => {
    if (speed < 16)
        return 4.0;
    if (speed < 19)
        return 6.8;
    if (speed < 22)
        return 8.0;
    if (speed < 25)
        return 10.0;
    return 12.0;
};
const createActivity = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { title, description, distance, // km
        duration, // seconds
        avgHeartRate, maxHeartRate, gpsData, source, } = req.body;
        // Fetch user for weight/height/stats
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
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
            const updateData = { longestRideDistance: distance };
            // Also update Stats total distance
            updateData.totalDistance = { increment: distance };
            await prisma_1.default.user.update({
                where: { id: userId },
                data: updateData,
            });
            // Create Notification
            await prisma_1.default.notification.create({
                data: {
                    userId,
                    type: 'NEW_RECORD',
                    message: `Congratulations! You set a new personal record: ${distance}km!`,
                },
            });
        }
        else {
            await prisma_1.default.user.update({
                where: { id: userId },
                data: { totalDistance: { increment: distance } },
            });
        }
        const activityTitle = title || `Ride on ${new Date().toLocaleDateString()}`;
        // 3. Create Activity
        const activity = await prisma_1.default.activity.create({
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
        const followers = await prisma_1.default.follows.findMany({
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
            await Promise.all(notifications.map(n => prisma_1.default.notification.create({ data: n })));
        }
        res.status(201).json({ ...activity, isNewRecord: isPersonalBest });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createActivity = createActivity;
const getActivities = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { username } = req.query; // Optional filter by username
        let whereClause = {};
        if (username) {
            const user = await prisma_1.default.user.findUnique({ where: { username: String(username) } });
            if (!user)
                return res.status(404).json({ message: 'User not found' });
            whereClause.userId = user.id;
        }
        else {
            // Default: Get feed (own + following)
            if (userId) {
                const following = await prisma_1.default.follows.findMany({
                    where: { followerId: userId },
                    select: { followingId: true }
                });
                const followingIds = following.map(f => f.followingId);
                // Include own and following
                whereClause.userId = { in: [userId, ...followingIds] };
            }
        }
        const activities = await prisma_1.default.activity.findMany({
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
            }, // Cast to any to avoid Prisma/TS mismatch errors temporarily
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        // Transform to add hasLiked boolean
        const activitiesWithLikeStatus = activities.map((activity) => ({
            ...activity,
            hasLiked: activity.likes.length > 0,
            likes: undefined, // remove the array
            likeCount: activity._count.likes,
            commentCount: activity._count.comments
        }));
        res.json(activitiesWithLikeStatus);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getActivities = getActivities;
const getActivity = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const activity = await prisma_1.default.activity.findUnique({
            where: { id },
            include: {
                user: {
                    select: { username: true, firstName: true, lastName: true, image: true }
                }
            }
        });
        if (!activity)
            return res.status(404).json({ message: 'Activity not found' });
        // Privacy check (if needed later), currently assuming open or self
        // if (activity.user.isPrivate && activity.userId !== userId) ...
        res.json(activity);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getActivity = getActivity;
const deleteActivity = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const activity = await prisma_1.default.activity.findUnique({ where: { id } });
        if (!activity)
            return res.status(404).json({ message: 'Activity not found' });
        if (activity.userId !== userId)
            return res.status(403).json({ message: 'Unauthorized' });
        await prisma_1.default.activity.delete({ where: { id } });
        // Update user stats (decrement distance)
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { totalDistance: { decrement: activity.distance } }
        });
        res.json({ message: 'Activity deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteActivity = deleteActivity;
const uploadActivityPhotos = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const files = req.files;
        if (!files || files.length === 0)
            return res.status(400).json({ message: 'No files uploaded' });
        const activity = await prisma_1.default.activity.findUnique({ where: { id } });
        if (!activity)
            return res.status(404).json({ message: 'Activity not found' });
        if (activity.userId !== userId)
            return res.status(403).json({ message: 'Unauthorized' });
        // Get existing images
        let images = [];
        if (activity.images) {
            try {
                images = JSON.parse(activity.images);
            }
            catch (e) {
                images = [];
            }
        }
        // Add new images (paths)
        // Assuming we serve static files from /uploads
        const newImages = files.map(file => `/uploads/${file.filename}`);
        images = [...images, ...newImages];
        const updatedActivity = await prisma_1.default.activity.update({
            where: { id },
            data: { images: JSON.stringify(images) }
        });
        res.json(updatedActivity);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.uploadActivityPhotos = uploadActivityPhotos;
const deleteActivityPhoto = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id, photoIndex } = req.params;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const activity = await prisma_1.default.activity.findUnique({ where: { id } });
        if (!activity)
            return res.status(404).json({ message: 'Activity not found' });
        if (activity.userId !== userId)
            return res.status(403).json({ message: 'Unauthorized' });
        // Get existing images
        let images = [];
        if (activity.images) {
            try {
                images = JSON.parse(activity.images);
            }
            catch (e) {
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
        const updatedActivity = await prisma_1.default.activity.update({
            where: { id },
            data: { images: JSON.stringify(images) }
        });
        // Optionally delete the physical file from disk
        try {
            const fullPath = `./uploads${photoPath.replace('/uploads', '')}`;
            if (fs_1.default.existsSync(fullPath)) {
                fs_1.default.unlinkSync(fullPath);
            }
        }
        catch (fileError) {
            console.error('Failed to delete physical file:', fileError);
            // Continue anyway - database updated
        }
        res.json(updatedActivity);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteActivityPhoto = deleteActivityPhoto;
const calculateDistance = (coord1, coord2) => {
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
const fit_file_parser_1 = __importDefault(require("fit-file-parser"));
const uploadActivityFile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const file = req.file;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!file)
            return res.status(400).json({ message: 'No file uploaded' });
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        console.log(`[Activity Upload] Processing ${ext} file for user ${userId}`);
        let totalDistance = 0;
        let elevationGain = 0;
        let startTime = new Date();
        let endTime = new Date();
        let duration = 0;
        let geoJson = null;
        let source = 'file_upload';
        if (ext === 'gpx') {
            source = 'gpx_upload';
            const gpxContent = fs_1.default.readFileSync(file.path, 'utf8');
            const gpxDoc = new xmldom_1.DOMParser().parseFromString(gpxContent, 'text/xml');
            geoJson = togeojson_1.default.gpx(gpxDoc);
            const trackFeature = geoJson.features?.find((f) => f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString');
            if (!trackFeature) {
                console.warn('[Activity Upload] No track feature found in GPX');
                fs_1.default.unlinkSync(file.path);
                return res.status(400).json({ message: 'No track data found in GPX file' });
            }
            const coords = trackFeature.geometry.coordinates;
            const times = trackFeature.properties?.coordTimes;
            if (coords && coords.length > 1) {
                for (let i = 0; i < coords.length - 1; i++) {
                    totalDistance += calculateDistance(coords[i], coords[i + 1]);
                    const ele1 = coords[i][2] || 0;
                    const ele2 = coords[i + 1][2] || 0;
                    if (ele2 > ele1)
                        elevationGain += (ele2 - ele1);
                }
            }
            else {
                console.warn('[Activity Upload] Insufficient coordinates in GPX');
            }
            if (times && times.length > 0) {
                startTime = new Date(times[0]);
                endTime = new Date(times[times.length - 1]);
                duration = (endTime.getTime() - startTime.getTime()) / 1000;
            }
            else {
                duration = 3600; // Default 1 hour if no timestamps
            }
        }
        else if (ext === 'tcx') {
            // ... (TCX logic remains similar but add checks if needed)
            source = 'tcx_upload';
            const tcxContent = fs_1.default.readFileSync(file.path, 'utf8');
            const tcxDoc = new xmldom_1.DOMParser().parseFromString(tcxContent, 'text/xml');
            const trackpoints = tcxDoc.getElementsByTagName('Trackpoint');
            if (trackpoints.length < 2) {
                fs_1.default.unlinkSync(file.path);
                return res.status(400).json({ message: 'Insufficient data in TCX file' });
            }
            // Existing TCX logic...
            const coords = [];
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
                            if (gain > 0.5)
                                elevationGain += gain;
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
        }
        else if (ext === 'fit') {
            // Existing FIT logic...
            source = 'fit_upload';
            const fileContent = fs_1.default.readFileSync(file.path);
            const fitParser = new fit_file_parser_1.default({ force: true, speedUnit: 'km/h', lengthUnit: 'km', mode: 'list' });
            await new Promise((resolve, reject) => {
                fitParser.parse(fileContent, (error, data) => {
                    if (error)
                        reject(error);
                    else {
                        if (data.sessions && data.sessions.length > 0) {
                            const session = data.sessions[0];
                            totalDistance = session.total_distance || 0;
                            duration = session.total_elapsed_time || 0;
                            elevationGain = session.total_ascent || 0;
                            startTime = new Date(session.start_time);
                        }
                        const coords = [];
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
                                totalDistance += calculateDistance(coords[i], coords[i + 1]);
                            }
                        }
                        resolve(true);
                    }
                });
            });
        }
        else {
            fs_1.default.unlinkSync(file.path);
            return res.status(400).json({ message: 'Unsupported file format.' });
        }
        // Final cleanup and DB update
        if (fs_1.default.existsSync(file.path))
            fs_1.default.unlinkSync(file.path);
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const speed = duration > 0 ? totalDistance / (duration / 3600) : 0;
        const weight = user.weight || 75;
        const mets = getMETs(speed);
        const calories = req.body.calories ? parseFloat(req.body.calories) : mets * weight * (duration / 3600);
        let isPersonalBest = false;
        if (totalDistance > (user.longestRideDistance || 0)) {
            isPersonalBest = true;
            await prisma_1.default.user.update({
                where: { id: userId },
                data: {
                    longestRideDistance: totalDistance,
                    totalDistance: { increment: totalDistance }
                }
            });
            await prisma_1.default.notification.create({
                data: {
                    userId,
                    type: 'NEW_RECORD',
                    message: `Congratulations! You set a new personal record: ${totalDistance.toFixed(2)}km!`,
                },
            });
        }
        else {
            await prisma_1.default.user.update({
                where: { id: userId },
                data: { totalDistance: { increment: totalDistance } }
            });
        }
        const activity = await prisma_1.default.activity.create({
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
    }
    catch (error) {
        console.error('[Activity Upload Error]:', error);
        res.status(500).json({ message: 'Server error processing file' });
    }
};
exports.uploadActivityFile = uploadActivityFile;
const updateActivity = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { title, description } = req.body;
        const activity = await prisma_1.default.activity.findUnique({ where: { id } });
        if (!activity)
            return res.status(404).json({ message: 'Activity not found' });
        if (activity.userId !== userId)
            return res.status(403).json({ message: 'Unauthorized' });
        const updated = await prisma_1.default.activity.update({
            where: { id },
            data: {
                title,
                description
            }
        });
        res.json(updated);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateActivity = updateActivity;
// Helper to update challenges
const updateUserChallenges = async (userId, activity) => {
    try {
        const activeChallenges = await prisma_1.default.challengeParticipant.findMany({
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
            }
            else if (challenge.type === 'TIME') {
                progressIncrement = activity.duration; // seconds
            }
            else if (challenge.type === 'RIDES') {
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
                    }
                    else {
                        // Stay at whatever was previously record high or 0
                        // actually user said progress should be 0 unless target is met.
                        newProgress = 0;
                    }
                    if (participant.completed) {
                        isCompleted = true; // Keep true if already done
                        newProgress = goalInUnits;
                    }
                }
                else {
                    // ACCUMULATIVE
                    newProgress = participant.progress + progressIncrement;
                    if (newProgress >= goalInUnits) {
                        isCompleted = true;
                    }
                }
                if (newProgress !== participant.progress || isCompleted !== participant.completed) {
                    await prisma_1.default.challengeParticipant.update({
                        where: { id: participant.id },
                        data: {
                            progress: newProgress,
                            completed: isCompleted
                        }
                    });
                    if (isCompleted && !participant.completed) {
                        await prisma_1.default.notification.create({
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
    }
    catch (error) {
        console.error('Error updating challenges:', error);
    }
};
const toggleLike = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const existingLike = await prisma_1.default.activityLike.findUnique({
            where: {
                userId_activityId: {
                    userId,
                    activityId: id
                }
            }
        });
        if (existingLike) {
            await prisma_1.default.activityLike.delete({
                where: { id: existingLike.id }
            });
            return res.json({ liked: false });
        }
        else {
            await prisma_1.default.activityLike.create({
                data: {
                    userId,
                    activityId: id
                }
            });
            // Notify activity owner
            const activity = await prisma_1.default.activity.findUnique({
                where: { id: String(id) },
                select: { userId: true, title: true }
            });
            const liker = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: { firstName: true, image: true }
            });
            if (activity && activity.userId !== userId) {
                await prisma_1.default.notification.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.toggleLike = toggleLike;
const addComment = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { text } = req.body;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!text)
            return res.status(400).json({ message: 'Text is required' });
        const comment = await prisma_1.default.activityComment.create({
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
        const activity = await prisma_1.default.activity.findUnique({
            where: { id: String(id) },
            select: { userId: true, title: true }
        });
        if (activity && activity.userId !== userId) {
            await prisma_1.default.notification.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.addComment = addComment;
const getComments = async (req, res) => {
    try {
        const { id } = req.params;
        const comments = await prisma_1.default.activityComment.findMany({
            where: { activityId: id },
            include: {
                user: {
                    select: { username: true, firstName: true, lastName: true, image: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(comments);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getComments = getComments;
const getActivityLikes = async (req, res) => {
    try {
        const { id } = req.params;
        const likes = await prisma_1.default.activityLike.findMany({
            where: { activityId: id },
            include: {
                user: {
                    select: { id: true, username: true, firstName: true, lastName: true, image: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        const likers = likes.map((like) => like.user);
        res.json(likers);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getActivityLikes = getActivityLikes;
