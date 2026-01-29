'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import ActivityCard from '@/components/ActivityCard';
import { useAuth } from '@/context/AuthContext';

export default function ActivitiesPage() {
    const { user } = useAuth();
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.username) {
            fetchActivities();
        }
    }, [user?.username]);

    const fetchActivities = async () => {
        if (!user?.username) return;
        try {
            const res = await api.get(`/activities?username=${user.username}`);
            setActivities(res.data);
        } catch (error) {
            console.error('Failed to fetch activities', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
                <Link href="/dashboard/upload" className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-indigo-700 flex items-center gap-2">
                    <Plus size={16} />
                    Upload Activity
                </Link>
            </div>

            <div className="max-w-3xl mx-auto">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading activities...</div>
                ) : activities.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-xl border border-gray-100">
                        <div className="text-4xl mb-4">🚴</div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No activities yet</h3>
                        <p className="text-gray-500 mb-4">Upload a GPX file or go for a ride to populate your feed.</p>
                        <Link href="/dashboard/upload" className="text-indigo-600 font-medium hover:underline">
                            Upload your first activity
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {activities.map((activity) => (
                            <ActivityCard
                                key={activity.id}
                                activity={activity}
                                currentUser={user}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
