'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Activity, Zap } from 'lucide-react';

export default function AnalysisPage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.username) return;
            try {
                // Fetch profile for milestones
                const profileRes = await api.get(`/users/${user.username}`);
                setProfile(profileRes.data);

                // Fetch activities for chart (last 30 days ideally, but using all for now)
                // Filter by username to ensure we ONLY get personal activities for analysis
                const actRes = await api.get(`/activities?username=${user.username}&limit=20`);
                setActivities(Array.isArray(actRes.data) ? actRes.data : []);
            } catch (error) {
                console.error('Failed to fetch analysis data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.username]);

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-64">Loading analysis...</div>
        </DashboardLayout>
    );

    // Prepare chart data (e.g., last 7 activities distance)
    const chartData = activities.slice(0, 7).reverse().map(a => ({
        name: new Date(a.startTime).toLocaleDateString(undefined, { weekday: 'short' }),
        distance: a.distance,
        elevation: a.elevationGain
    }));

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Analysis Center</h1>

            {/* Highlights Section */}
            {profile?.highlights && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-shadow">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-2">Longest Ride</div>
                        {profile.highlights.longestRide ? (
                            <Link href={`/dashboard/activities/${profile.highlights.longestRide.id}?from=analysis`} className="block">
                                <div className="text-xl font-bold text-indigo-600">{profile.highlights.longestRide.distance} km</div>
                                <div className="text-sm font-medium text-gray-800 truncate">{profile.highlights.longestRide.title}</div>
                                <div className="text-xs text-gray-400">{new Date(profile.highlights.longestRide.startTime).toLocaleDateString()}</div>
                            </Link>
                        ) : <div className="text-sm text-gray-400">No rides yet</div>}
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-shadow">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-2">Most Liked</div>
                        {profile.highlights.mostLiked ? (
                            <Link href={`/dashboard/activities/${profile.highlights.mostLiked.id}?from=analysis`} className="block">
                                <div className="text-xl font-bold text-pink-600">{profile.highlights.mostLiked.likeCount} likes</div>
                                <div className="text-sm font-medium text-gray-800 truncate">{profile.highlights.mostLiked.title}</div>
                                <div className="text-xs text-gray-400">{new Date(profile.highlights.mostLiked.startTime).toLocaleDateString()}</div>
                            </Link>
                        ) : <div className="text-sm text-gray-400">No likes yet</div>}
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-shadow">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-2">Most Commented</div>
                        {profile.highlights.mostCommented ? (
                            <Link href={`/dashboard/activities/${profile.highlights.mostCommented.id}?from=analysis`} className="block">
                                <div className="text-xl font-bold text-blue-600">{profile.highlights.mostCommented.commentCount} comments</div>
                                <div className="text-sm font-medium text-gray-800 truncate">{profile.highlights.mostCommented.title}</div>
                                <div className="text-xs text-gray-400">{new Date(profile.highlights.mostCommented.startTime).toLocaleDateString()}</div>
                            </Link>
                        ) : <div className="text-sm text-gray-400">No comments yet</div>}
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-shadow">
                        <div className="text-xs text-gray-500 uppercase font-bold mb-2">Highest Reach</div>
                        {profile.highlights.highestReach ? (
                            <Link href={`/dashboard/activities/${profile.highlights.highestReach.id}?from=analysis`} className="block">
                                <div className="text-xl font-bold text-purple-600">{profile.highlights.highestReach.reach} interactions</div>
                                <div className="text-sm font-medium text-gray-800 truncate">{profile.highlights.highestReach.title}</div>
                                <div className="text-xs text-gray-400">Likes + Comments</div>
                            </Link>
                        ) : <div className="text-sm text-gray-400">No interactions yet</div>}
                    </div>
                </div>
            )}

            {/* Milestones Card */}
            <MilestonesSection milestones={profile?.milestones} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Distance Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="text-indigo-500" />
                        <h2 className="text-lg font-bold text-gray-900">Recent Distances</h2>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip />
                                <Bar dataKey="distance" fill="#6366f1" radius={[4, 4, 0, 0]} name="Distance (km)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Elevation/Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="text-yellow-500" />
                        <h2 className="text-lg font-bold text-gray-900">Performance Stats</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Total Distance</span>
                            <span className="text-xl font-bold text-gray-900">{Number(profile?.totalDistance || 0).toFixed(0)} km</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Longest Ride</span>
                            <span className="text-xl font-bold text-gray-900">{Number(profile?.longestRideDistance || 0).toFixed(0)} km</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Activities</span>
                            <span className="text-xl font-bold text-gray-900">{profile?._count?.activities || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Elev Gain</span>
                            <span className="text-xl font-bold text-gray-900">{Number(profile?.totalElevationGain || 0).toFixed(0)} m</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Time</span>
                            <span className="text-xl font-bold text-gray-900">
                                {Math.floor((profile?.totalDuration || 0) / 3600)}h {Math.round(((profile?.totalDuration || 0) % 3600) / 60)}m
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// Milestone Components
const MilestonesSection = ({ milestones }: { milestones: any }) => {
    const [selectedMilestone, setSelectedMilestone] = useState<{ title: string, activities: any[] } | null>(null);

    if (!milestones) return null;

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Trophy className="text-amber-500" />
                    <h2 className="text-lg font-bold text-gray-900">Milestones Achievements</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {Object.entries(milestones).map(([key, activities]: [string, any]) => {
                        const count = Array.isArray(activities) ? activities.length : 0;
                        return (
                            <div
                                key={key}
                                onClick={() => count > 0 && setSelectedMilestone({ title: key, activities })}
                                className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${count > 0 ? 'bg-amber-50 border-amber-200 cursor-pointer hover:shadow-md hover:translate-y-[-2px]' : 'bg-gray-50 border-gray-100 opacity-60'}`}
                            >
                                <div className={`text-xs font-bold uppercase mb-1 ${count > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{key}</div>
                                <div className={`text-2xl font-bold ${count > 0 ? 'text-gray-900' : 'text-gray-400'}`}>{count}</div>
                                <div className="text-[10px] text-gray-400">times achieved</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedMilestone && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedMilestone(null)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">{selectedMilestone.title} Rides</h3>
                            <button onClick={() => setSelectedMilestone(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                        </div>
                        <div className="space-y-3">
                            {selectedMilestone.activities.map((activity: any) => (
                                <Link href={`/dashboard/activities/${activity.id}?from=analysis`} key={activity.id} className="block border border-gray-100 rounded-lg p-3 hover:bg-gray-50 flex justify-between items-center transition-colors">
                                    <div>
                                        <div className="font-medium text-gray-900 hover:text-indigo-600">{activity.title}</div>
                                        <div className="text-xs text-gray-500">{new Date(activity.startTime).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-indigo-600">{activity.distance} km</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
