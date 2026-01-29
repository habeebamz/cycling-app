
'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout'; // Updated import
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Users, Activity, Flag, Trophy, AlertTriangle, Settings } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);

    // Auth check moved to layout mostly, but keep minimal check or rely on layout
    useEffect(() => {
        if (!loading && user?.role === 'ADMIN') {
            fetchStats();
        }
    }, [user, loading]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Failed to fetch admin stats', error);
        }
    };

    if (loading || !stats) {
        return <AdminLayout>
            <div className="flex items-center justify-center h-64 text-gray-400">Loading statistics...</div>
        </AdminLayout>;
    }

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                {/* Header removed as it's in layout now, or keep separate sub-header */}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={Users} label="Total Users" value={stats.users} color="bg-blue-600" />
                    <StatCard icon={Activity} label="Activities" value={stats.activities} color="bg-orange-600" />
                    <StatCard icon={Flag} label="Groups" value={stats.groups} color="bg-green-600" />
                    <StatCard icon={AlertTriangle} label="Violations" value={stats.reports} color="bg-red-600" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Settings size={20} className="text-gray-400" />
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Link href="/hradmin/users" className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-3 rounded-xl transition-all font-bold text-sm border border-gray-100 flex items-center justify-center gap-2 shadow-sm">
                                <Users size={18} /> Manage Users
                            </Link>
                            <Link href="/hradmin/violations" className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-3 rounded-xl transition-all font-bold text-sm border border-red-100 flex items-center justify-center gap-2 shadow-sm">
                                <AlertTriangle size={18} /> Review Reports
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
        <div className={`p-4 rounded-lg ${color} text-white shadow-md`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
    </div>
);
