
'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Trash2 } from 'lucide-react';

export default function ActivitiesManagement() {
    const { user, loading } = useAuth();
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        if (!loading && user?.role === 'ADMIN') {
            fetchActivities();
        }
    }, [user, loading]);

    const fetchActivities = async () => {
        try {
            const res = await api.get('/admin/activities');
            setActivities(res.data);
        } catch (error) {
            console.error('Failed to fetch activities', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this activity?')) return;
        try {
            await api.delete(`/admin/activities/${id}`);
            setActivities(activities.filter(a => a.id !== id));
        } catch (error) {
            alert('Failed to delete activity');
        }
    };

    if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
                    <p className="text-gray-500">Monitor and moderate user activities.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Activity</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">User</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Stats</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {activities.map((a) => (
                                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{a.title}</div>
                                        <div className="text-xs text-gray-400">{new Date(a.startTime).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        @{a.user?.username}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {a.distance}km | {Math.round(a.duration / 60)}m
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(a.id)}
                                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
