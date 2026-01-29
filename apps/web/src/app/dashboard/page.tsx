'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Trash2, Camera, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import ActivityCard from '@/components/ActivityCard';
import ProfileSidebar from '@/components/dashboard/ProfileSidebar';
import RightSidebar from '@/components/dashboard/RightSidebar';

export default function DashboardPage() {
    // Add useAuth to get current user for profile fetch
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [challenges, setChallenges] = useState<any[]>([]);

    const [userGroups, setUserGroups] = useState<any[]>([]);
    const [personalActivities, setPersonalActivities] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            fetchFeed();
        }
        if (user?.username) {
            fetchProfile();
            fetchChallenges();
            fetchPersonalActivities();
            fetchUserGroups();
        }
    }, [user, user?.username]);

    const fetchUserGroups = async () => {
        try {
            const res = await api.get('/users/me/groups');
            setUserGroups(res.data);
        } catch (error) {
            console.error('Failed to fetch user groups', error);
        }
    };

    const fetchPersonalActivities = async () => {
        try {
            // Fetch personal activities only (first 50 for stats/chart)
            const res = await api.get(`/activities?username=${user?.username}&limit=50`);
            setPersonalActivities(res.data);

            // Calculate Milestones locally (Personal only)
            const milestones: Record<string, number> = {
                '25km': 0, '50km': 0, '100km': 0, '200km': 0,
                '300km': 0, '400km': 0, '600km': 0, '1000km': 0, '1000km+': 0
            };
            let totalElevation = 0;

            res.data.forEach((a: any) => {
                if (a.elevationGain) totalElevation += a.elevationGain;
                const d = a.distance;
                if (d >= 25) milestones['25km']++;
                if (d >= 50) milestones['50km']++;
                if (d >= 100) milestones['100km']++;
                if (d >= 200) milestones['200km']++;
                if (d >= 300) milestones['300km']++;
                if (d >= 400) milestones['400km']++;
                if (d >= 600) milestones['600km']++;
                if (d >= 1000) milestones['1000km']++;
                if (d > 1000) milestones['1000km+']++;
            });

            setStats({
                totalDistance: res.data.reduce((acc: number, curr: any) => acc + curr.distance, 0),
                rideCount: res.data.length,
                totalElevation,
                milestones,
                latestActivity: res.data[0] || null
            });
        } catch (error) {
            console.error('Failed to fetch personal activities', error);
        }
    };

    const fetchFeed = async () => {
        try {
            const res = await api.get('/activities');
            setActivities(res.data);
        } catch (error) {
            console.error('Failed to fetch feed', error);
        }
    };

    const fetchChallenges = async () => {
        try {
            const res = await api.get('/challenges/my-groups');
            setChallenges(res.data);
        } catch (error) {
            console.error('Failed to fetch challenges', error);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await api.get(`/users/${user?.username}`);
            setUserProfile(res.data);
        } catch (error) {
            console.error('Failed to fetch profile', error);
        }
    };

    const fetchData = async () => {
        // Legacy, redirected to separate fetches
        fetchFeed();
        fetchPersonalActivities();
    };


    // Handlers for deleting and uploading
    const handleGpxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files.length) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/activities/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Activity uploaded successfully!');
            fetchPersonalActivities();
            fetchFeed();
        } catch (error) {
            console.error(error);
            alert('Failed to upload GPX file');
        }
    }

    return (
        <DashboardLayout>
            {/* 3-Column Layout */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Sidebar - Profile (3 cols) */}
                <div className="lg:col-span-3 hidden lg:block">
                    <ProfileSidebar stats={stats} latestActivity={stats?.latestActivity} userProfile={userProfile} challenges={challenges} activities={personalActivities} />
                </div>

                {/* Main Feed (6 cols) */}
                <div className="lg:col-span-6">
                    {/* Mobile Only: Simple Welcome/Action Header */}
                    <div className="lg:hidden mb-6 flex justify-between items-center">
                        <h1 className="text-xl font-bold text-gray-900">Feed</h1>
                        <label className="text-indigo-600 font-bold text-sm cursor-pointer">
                            Upload
                            <input type="file" className="hidden" accept=".gpx" onChange={handleGpxUpload} />
                        </label>
                    </div>



                    <div className="space-y-6">
                        {activities.map((activity) => (
                            <ActivityCard
                                key={activity.id}
                                activity={activity}
                                currentUser={user}
                            />
                        ))}
                        {activities.length === 0 && (
                            <div className="text-center py-16 bg-white rounded-lg border border-gray-100 text-gray-500">
                                <div className="mb-4 text-6xl">🚴</div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No activities yet</h3>
                                <p className="mb-6">Upload a GPX file or go for a ride to populate your feed.</p>
                                <label className="inline-block bg-orange-600 text-white px-6 py-3 rounded font-bold hover:bg-orange-700 cursor-pointer transition-colors">
                                    Upload First Activity
                                    <input type="file" className="hidden" accept=".gpx" onChange={handleGpxUpload} />
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Widgets (3 cols) */}
                <div className="lg:col-span-3 hidden lg:block">
                    <RightSidebar challenges={challenges} userGroups={userGroups} />
                </div>
            </div>
        </DashboardLayout>
    );
}
