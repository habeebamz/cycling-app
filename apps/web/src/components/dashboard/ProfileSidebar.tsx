'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import FollowListModal from '@/components/modals/FollowListModal';
import api from '@/lib/api';

interface ProfileSidebarProps {
    stats?: {
        totalDistance: number;
        rideCount: number;
        totalElevation: number;
    };
    latestActivity?: any;
    userProfile?: any;
    challenges?: any[];
    activities?: any[];
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ stats, latestActivity, userProfile, challenges = [], activities = [] }) => {
    const { user } = useAuth();
    // Use userProfile data if available, fallback to auth user context
    const displayUser = userProfile || user;

    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalUsers, setModalUsers] = useState<any[]>([]);

    const openFollowList = async (type: 'followers' | 'following') => {
        if (!displayUser?.username) return;
        setModalTitle(type === 'followers' ? 'Followers' : 'Following');
        setShowModal(true);
        setModalUsers([]); // Clear previous

        try {
            const res = await api.get(`/users/${displayUser.username}/${type}`);
            setModalUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch follow list', error);
        }
    };

    // Calculate Weekly Stats (Start Sunday)
    const getWeeklyStats = () => {
        const now = new Date();
        const startOfWeek = new Date(now);
        const day = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
        startOfWeek.setDate(now.getDate() - day);
        startOfWeek.setHours(0, 0, 0, 0);

        const weeklyActivities = activities.filter(a =>
            a.userId === user?.id && new Date(a.startTime) >= startOfWeek
        );

        const totalDist = weeklyActivities.reduce((sum, a) => sum + (a.distance || 0), 0);
        const totalElev = weeklyActivities.reduce((sum, a) => sum + (a.elevationGain || 0), 0);
        const totalTime = weeklyActivities.reduce((sum, a) => sum + (a.duration || 0), 0);

        // Map distances to days: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
        const dailyDistances = [0, 0, 0, 0, 0, 0, 0];
        weeklyActivities.forEach(a => {
            const d = new Date(a.startTime).getDay();
            dailyDistances[d] += a.distance;
        });

        const maxDist = Math.max(...dailyDistances, 1); // Avoid div by zero

        return {
            totalDist,
            totalElev,
            totalTime,
            dailyDistances,
            maxDist
        };
    };

    const weekly = getWeeklyStats();

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    if (!user) return null;

    return (
        <div className="space-y-6 sticky top-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 text-center">
                    <div className="h-20 w-20 rounded-full bg-gray-200 mx-auto mb-4 overflow-hidden">
                        {displayUser.image ? (
                            <img
                                src={displayUser.image.startsWith('http') ? displayUser.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${displayUser.image}`}
                                alt={displayUser.username}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold text-2xl">{displayUser.firstName?.[0] || '?'}</div>
                        )}
                    </div>

                    <Link href={`/cyclist/${displayUser.username}`} className="hover:underline hover:text-indigo-600 transition-colors">
                        <h2 className="text-xl font-bold text-gray-900">{displayUser.firstName} {displayUser.lastName}</h2>
                    </Link>

                    <div className="flex justify-center gap-8 mt-6 border-t border-gray-50 pt-4">
                        <div className="text-center cursor-pointer hover:bg-gray-50 rounded p-1 transition-colors" onClick={() => openFollowList('following')}>
                            <div className="text-xs text-gray-500 mb-1">Following</div>
                            <div className="text-lg font-bold text-gray-900">{userProfile?._count?.following || 0}</div>
                        </div>
                        <div className="text-center cursor-pointer hover:bg-gray-50 rounded p-1 transition-colors" onClick={() => openFollowList('followers')}>
                            <div className="text-xs text-gray-500 mb-1">Followers</div>
                            <div className="text-lg font-bold text-gray-900">{userProfile?._count?.followers || 0}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Activities</div>
                            <div className="text-lg font-bold text-gray-900">{stats?.rideCount || 0}</div>
                        </div>
                    </div>
                </div>

                {latestActivity && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                        <div className="text-xs text-gray-500 mb-2">Latest Activity</div>
                        <div className="font-medium text-gray-900 text-sm mb-1">{latestActivity.title}</div>
                        <div className="text-xs text-gray-500">
                            {new Date(latestActivity.startTime).toLocaleDateString()}
                        </div>
                    </div>
                )}

                <Link href={`/cyclist/${displayUser.username}`} className="block px-6 py-3 border-t border-gray-100 text-sm text-indigo-600 font-medium hover:bg-gray-50 transition-colors flex items-center justify-between">
                    Your Training Log
                    <ChevronRight size={16} />
                </Link>
            </div>

            {/* Weekly Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                    This Week
                </h3>
                <div className="text-center py-2">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                        {weekly.totalDist.toFixed(1)} <span className="text-base font-normal text-gray-500">km</span>
                    </div>

                    {/* Bar Chart */}
                    <div className="grid grid-cols-7 gap-1 mt-6 mb-2 px-1 h-16 items-end">
                        {weekly.dailyDistances.map((dist, i) => (
                            <div key={i} className="group relative flex justify-center h-full items-end">
                                <div
                                    className={`w-full rounded-t-sm transition-all duration-500 ${dist > 0 ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gray-100'}`}
                                    style={{ height: `${Math.max((dist / weekly.maxDist) * 100, 4)}%` }}
                                ></div>
                                {dist > 0 && (
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 w-max bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-90 transition-opacity">
                                        {dist.toFixed(1)}km
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 text-[10px] font-bold text-gray-400 mt-1 uppercase">
                        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                    </div>

                    <div className="border-t border-gray-100 mt-6 pt-4 flex justify-between items-center text-xs">
                        <div className="flex flex-col items-start">
                            <span className="text-gray-400 uppercase font-medium">Time</span>
                            <span className="text-gray-900 font-bold">{formatDuration(weekly.totalTime)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-gray-400 uppercase font-medium">Elev Gain</span>
                            <span className="text-gray-900 font-bold">{weekly.totalElev.toFixed(0)} m</span>
                        </div>
                    </div>
                </div>
            </div>
            {showModal && (
                <FollowListModal
                    title={modalTitle}
                    users={modalUsers}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

export default ProfileSidebar;
