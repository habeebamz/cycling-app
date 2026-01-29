'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ThumbsUp, MessageSquare, Clock, ArrowUpRight, MapPin, MoreVertical, Edit, Trash2, Camera, Flag } from 'lucide-react';
import api from '@/lib/api';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import FollowListModal from './modals/FollowListModal';
import ReportModal from './modals/ReportModal';

// Dynamically import map to avoid SSR issues with Leaflet
const ActivityMap = dynamic(() => import('./maps/ActivityMap'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Loading Map...</div>
});

interface ActivityCardProps {
    activity: any;
    currentUser?: any;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, currentUser }) => {
    const router = useRouter();
    const [liked, setLiked] = useState(activity.hasLiked);
    const [likeCount, setLikeCount] = useState(activity.likeCount || 0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);

    // Menu & File Upload
    const [showMenu, setShowMenu] = useState(false);
    const optionsRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);

    // Likes Modal State
    const [showLikersModal, setShowLikersModal] = useState(false);
    const [likers, setLikers] = useState<any[]>([]);
    const [fetchingLikers, setFetchingLikers] = useState(false);

    // Report Modal State
    const [showReportModal, setShowReportModal] = useState(false);

    const fetchLikers = async () => {
        if (likeCount === 0) return;
        setFetchingLikers(true);
        setShowLikersModal(true);
        try {
            const res = await api.get(`/activities/${activity.id}/likes`);
            setLikers(res.data);
        } catch (error) {
            console.error('Failed to fetch likers', error);
        } finally {
            setFetchingLikers(false);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLike = async () => {
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);
        try {
            await api.post(`/activities/${activity.id}/like`);
        } catch (error) {
            setLiked(!newLiked);
            setLikeCount(newLiked ? likeCount - 1 : likeCount + 1);
            console.error('Failed to like activity');
        }
    };

    const fetchComments = async () => {
        if (!showComments && comments.length === 0) {
            setLoadingComments(true);
            try {
                const res = await api.get(`/activities/${activity.id}/comments`);
                setComments(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingComments(false);
            }
        }
        setShowComments(!showComments);
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        try {
            const res = await api.post(`/activities/${activity.id}/comments`, { text: commentText });
            setComments([...comments, res.data]);
            setCommentText('');
        } catch (error) {
            console.error('Failed to post comment');
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this activity? This cannot be undone.")) return;
        try {
            await api.delete(`/activities/${activity.id}`);
            setIsDeleted(true); // Hide card
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete activity");
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const formData = new FormData();
        Array.from(e.target.files).forEach(file => {
            formData.append('photos', file);
        });

        setUploading(true);
        try {
            await api.post(`/activities/${activity.id}/photos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            window.location.reload(); // Quick refresh to show images inside the card
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload photos");
        } finally {
            setUploading(false);
            setShowMenu(false);
        }
    };

    if (isDeleted) return null;

    const images = activity.images ? (typeof activity.images === 'string' ? JSON.parse(activity.images) : activity.images) : [];
    const formattedDate = new Date(activity.startTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = new Date(activity.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    let gpsData = null;
    try {
        if (activity.gpsData) gpsData = JSON.parse(activity.gpsData);
    } catch (e) { console.warn('Failed to parse GPS data', e); }

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const formatPace = (duration: number, distance: number) => {
        if (!distance) return '0:00';
        const pace = duration / 60 / distance;
        const min = Math.floor(pace);
        const sec = Math.round((pace - min) * 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec} /km`;
    };

    // Check if current user is the activity owner
    const isOwner = !!(
        currentUser &&
        activity.userId &&
        (String(activity.userId) === String(currentUser.id) || String(activity.userId) === String(currentUser.userId))
    );

    const showMenuButton = isOwner || !!currentUser;

    return (
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden mb-6 relative">
            {/* Header */}
            <div className="p-3 md:p-4 flex gap-2 md:gap-3 relative">
                <Link href={`/cyclist/${activity.user.username}`} className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                        {activity.user.image ? (
                            <img src={activity.user.image.startsWith('http') ? activity.user.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${activity.user.image}`} alt={`${activity.user.firstName} ${activity.user.lastName}'s Profile Picture`} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold">{activity.user.firstName?.[0]}</div>
                        )}
                    </div>
                </Link>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <Link href={`/cyclist/${activity.user.username}`} className="font-bold text-gray-900 hover:text-indigo-600 block text-sm">
                                {activity.user.firstName} {activity.user.lastName}
                            </Link>
                            <div className="text-xs text-gray-500 mt-0.5">
                                {formattedDate} at {formattedTime} • {activity.user.city || 'Zwift'}
                            </div>
                        </div>

                        {showMenuButton && (
                            <div className="relative" ref={optionsRef}>
                                <button onClick={() => setShowMenu(!showMenu)} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                                    <MoreVertical size={20} />
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-8 bg-white rounded-lg shadow-xl border border-gray-100 py-1 w-48 z-10">
                                        {isOwner ? (
                                            <>
                                                <button
                                                    onClick={() => router.push(`/dashboard/activities/${activity.id}`)}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <Edit size={16} /> Edit Activity
                                                </button>

                                                <label className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
                                                    <Camera size={16} /> Add Photos
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handlePhotoUpload}
                                                    />
                                                </label>

                                                <button
                                                    onClick={handleDelete}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <Trash2 size={16} /> Delete
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            >
                                                <Flag size={16} /> Report
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-gray-100 px-1 py-0.5 rounded text-[10px] uppercase font-bold text-gray-500">Ride</div>
                            <Link href={`/dashboard/activities/${activity.id}`}>
                                <h3 className="text-lg font-bold text-gray-900 hover:text-indigo-600">{activity.title}</h3>
                            </Link>
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-2 mb-3">{activity.description}</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-6 mb-3">
                            <div>
                                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Distance</div>
                                <div className="text-base font-bold text-gray-900">{activity.distance}<span className="text-xs font-normal text-gray-500 ml-1">km</span></div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Pace</div>
                                <div className="text-base font-bold text-gray-900">{formatPace(activity.duration, activity.distance)}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Time</div>
                                <div className="text-base font-bold text-gray-900">{formatDuration(activity.duration)}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Elev Gain</div>
                                <div className="text-base font-bold text-gray-900">{activity.elevationGain}<span className="text-xs font-normal text-gray-500 ml-1">m</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map/Image Area */}
            {gpsData ? (
                <div className="w-full h-48 sm:h-64 md:h-80 bg-gray-100 relative mb-2 z-0">
                    <ActivityMap geoJson={gpsData} />
                </div>
            ) : (images.length > 0) ? (
                <div className="w-full h-48 sm:h-64 md:h-80 bg-gray-100 relative mb-2">
                    <img src={images[0].startsWith('http') ? images[0] : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${images[0]}`} alt="Activity" className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="w-full h-64 bg-gray-50 relative border-y border-gray-100 mb-2 flex items-center justify-center">
                    <div className="text-gray-400 flex flex-col items-center">
                        <MapPin size={32} className="mb-2 opacity-20" />
                        <span className="text-xs">Map not available</span>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={handleLike} className="p-2 hover:bg-gray-100 rounded transition-colors group">
                        <ThumbsUp size={20} className={`transition-colors ${liked ? 'fill-indigo-600 text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    </button>
                    <button onClick={fetchComments} className="p-2 hover:bg-gray-100 rounded transition-colors group">
                        <MessageSquare size={20} className="text-gray-400 group-hover:text-gray-600" />
                    </button>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    {likeCount > 0 && (
                        <button
                            onClick={fetchLikers}
                            className="hover:text-indigo-600 hover:underline transition-colors font-medium focus:outline-none"
                        >
                            {likeCount} {likeCount === 1 ? 'kudo' : 'kudos'}
                        </button>
                    )}
                    {activity.commentCount > 0 && (
                        <button
                            onClick={fetchComments}
                            className="hover:text-indigo-600 hover:underline transition-colors font-medium focus:outline-none"
                        >
                            {activity.commentCount} {activity.commentCount === 1 ? 'comment' : 'comments'}
                        </button>
                    )}
                </div>
            </div>

            {/* Likers Modal */}
            {showLikersModal && (
                <FollowListModal
                    title="Kudos"
                    users={likers}
                    onClose={() => setShowLikersModal(false)}
                />
            )}

            {/* Report Modal */}
            {showReportModal && (
                <ReportModal
                    isOpen={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    entityId={activity.id}
                    entityType="activity"
                />
            )}

            {/* Comments */}
            {showComments && (
                <div className="bg-gray-50 px-4 py-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                    {loadingComments ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-4 mb-4">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 text-sm group/comment">
                                    <Link href={`/cyclist/${comment.user.username}`} className="shrink-0 pt-0.5">
                                        <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden ring-2 ring-white shadow-sm border border-gray-100">
                                            {comment.user.image ? (
                                                <img
                                                    src={comment.user.image.startsWith('http') ? comment.user.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${comment.user.image}`}
                                                    alt={`${comment.user.firstName} ${comment.user.lastName}'s Profile Picture`}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold text-xs uppercase">
                                                    {comment.user.firstName?.[0]}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="flex-1">
                                        <div className="bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm inline-block">
                                            <Link
                                                href={`/cyclist/${comment.user.username}`}
                                                className="font-bold text-gray-900 hover:text-indigo-600 transition-colors mr-1 cursor-pointer"
                                            >
                                                {comment.user.firstName} {comment.user.lastName}:
                                            </Link>
                                            <span className="text-gray-700">{comment.text}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1 ml-1 flex items-center gap-2">
                                            {/* We could add time here if comment has createdAt */}
                                            {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && <div className="text-xs text-gray-400 italic text-center py-2">No comments yet.</div>}
                        </div>
                    )}
                    <form onSubmit={handleCommentSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button type="submit" className="bg-indigo-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-indigo-700">Post</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ActivityCard;
