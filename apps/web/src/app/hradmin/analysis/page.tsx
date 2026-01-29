
'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

export default function AdminAnalysis() {
    const { user, loading } = useAuth();
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (!loading && user?.role === 'ADMIN') {
            // For now reusing dashboard stats, in real app we'd fetch deeper analytics
            // Mocking chart data for demonstration as backend aggregation is limited
            fetchStats();
        }
    }, [user, loading]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            setStats(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    // Mock data for visualization
    const activityData = [
        { name: 'Mon', rides: 40, distance: 240 },
        { name: 'Tue', rides: 30, distance: 139 },
        { name: 'Wed', rides: 20, distance: 980 },
        { name: 'Thu', rides: 27, distance: 390 },
        { name: 'Fri', rides: 18, distance: 480 },
        { name: 'Sat', rides: 23, distance: 380 },
        { name: 'Sun', rides: 34, distance: 430 },
    ];

    const groupData = [
        { name: 'Cycling Clubs', value: 400 },
        { name: 'Casual Groups', value: 300 },
        { name: 'Training Teams', value: 300 },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

    if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Platform Analysis</h1>
                    <p className="text-gray-500">Real-time overview of platform activity and engagement.</p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Rides Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Rides</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.today?.rides || 0}</h3>
                            </div>
                            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">Today</span>
                        </div>
                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                            <span className="text-gray-500">Total All-Time</span>
                            <span className="font-semibold text-gray-900">{stats?.total?.rides || 0}</span>
                        </div>
                    </div>

                    {/* Distance Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Distance</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{Math.round(stats?.today?.distance || 0)} <span className="text-sm font-normal text-gray-500">km</span></h3>
                            </div>
                            <span className="bg-green-50 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">Today</span>
                        </div>
                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                            <span className="text-gray-500">Total All-Time</span>
                            <span className="font-semibold text-gray-900">{Math.round(stats?.total?.distance || 0).toLocaleString()} km</span>
                        </div>
                    </div>

                    {/* Elevation Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Elevation</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{Math.round(stats?.today?.elevation || 0)} <span className="text-sm font-normal text-gray-500">m</span></h3>
                            </div>
                            <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-1 rounded-full">Today</span>
                        </div>
                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                            <span className="text-gray-500">Total All-Time</span>
                            <span className="font-semibold text-gray-900">{Math.round(stats?.total?.elevation || 0).toLocaleString()} m</span>
                        </div>
                    </div>

                    {/* Time Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Active Time</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                                    {Math.floor((stats?.today?.duration || 0) / 3600)}h {Math.round(((stats?.today?.duration || 0) % 3600) / 60)}m
                                </h3>
                            </div>
                            <span className="bg-purple-50 text-purple-700 text-xs font-semibold px-2 py-1 rounded-full">Today</span>
                        </div>
                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                            <span className="text-gray-500">Total All-Time</span>
                            <span className="font-semibold text-gray-900">
                                {Math.floor((stats?.total?.duration || 0) / 3600)}h
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Activity Trend */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Activity Volume (Weekly)</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={activityData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="distance" stroke="#8884d8" name="Distance (km)" />
                                    <Line type="monotone" dataKey="rides" stroke="#82ca9d" name="Rides" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Group Distribution */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Community Distribution</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={groupData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {groupData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">User Growth</h3>
                    <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        Detailed User Growth Chart Component Placeholder
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
