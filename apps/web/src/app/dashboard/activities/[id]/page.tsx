'use client';

import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Activity, Clock, Zap, Heart, Map as MapIcon, Calendar, ArrowLeft, Edit, Trash2, Camera, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import Map with no SSR
const ActivityMap = dynamic(() => import('@/components/maps/ActivityMap'), {
    ssr: false,
    loading: () => <div className="h-96 w-full bg-gray-100 animate-pulse rounded-xl"></div>
});

export default function ActivityDetailsPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = params.id as string;
    const from = searchParams.get('from');

    const [activity, setActivity] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', description: '' });

    // Photo Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchActivity();
        fetchCurrentUser();
    }, [id]);

    const fetchActivity = async () => {
        try {
            const res = await api.get(`/activities/${id}`);
            setActivity(res.data);
            setEditForm({
                title: res.data.title || '',
                description: res.data.description || ''
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const res = await api.get('/auth/me');
            setCurrentUserId(res.data.id);
        } catch (e) {
            console.error("Auth check failed", e);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this activity? This cannot be undone.")) return;
        try {
            await api.delete(`/activities/${id}`);
            router.push('/dashboard');
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete activity");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/activities/${id}`, editForm);
            setIsEditing(false);
            fetchActivity(); // Refresh
        } catch (error) {
            console.error("Update failed", error);
            alert("Failed to update activity");
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
            await api.post(`/activities/${id}/photos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchActivity(); // Refresh to see photos
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload photos");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) return <CustomLoading />;
    if (!activity) return <div>Activity not found</div>;

    const parsedGps = activity.gpsData ? JSON.parse(activity.gpsData) : null;
    // Parse photos if array stored as JSON string, or standard array
    let photos: string[] = [];
    try {
        if (Array.isArray(activity.images)) photos = activity.images;
        else if (typeof activity.images === 'string') photos = JSON.parse(activity.images);
    } catch (e) { photos = []; }

    const isOwner = currentUserId && activity.userId === currentUserId;

    // Smart Back Link
    const backLink = from === 'analysis' ? '/dashboard/analysis' : '/dashboard';
    const backText = from === 'analysis' ? 'Back to Analysis' : 'Back to Dashboard';

    return (
        <DashboardLayout>
            <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                    <Link href={backLink} className="flex items-center text-sm text-gray-500 hover:text-indigo-600 w-fit">
                        <ArrowLeft size={16} className="mr-1" /> {backText}
                    </Link>

                    {isOwner && (
                        <div className="flex gap-2">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handlePhotoUpload}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                            >
                                <Camera size={14} /> {uploading ? 'Uploading...' : 'Add Photos'}
                            </button>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm font-medium transition-colors"
                            >
                                <Edit size={14} /> Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    )}
                </div>

                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">{activity.title}</h1>
                    <p className="text-gray-500 flex items-center gap-2">
                        <Calendar size={14} /> {new Date(activity.startTime).toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Main Stats Card */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Map Container */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[400px]">
                        {parsedGps ? (
                            <ActivityMap geoJson={parsedGps} />
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                <MapIcon size={48} className="mb-2 opacity-20" />
                                <p>No GPS Data Available</p>
                            </div>
                        )}
                    </div>

                    {/* Photos Section */}
                    {photos.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Camera size={18} /> Photos
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {photos.map((photo, idx) => (
                                    <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative group">
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${photo}`}
                                            alt={`Activity photo ${idx + 1}`}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                        {isOwner && (
                                            <button
                                                onClick={async () => {
                                                    if (!confirm('Are you sure you want to delete this photo?')) return;
                                                    try {
                                                        await api.delete(`/activities/${id}/photos/${idx}`);
                                                        fetchActivity(); // Refresh to show updated photos
                                                    } catch (error) {
                                                        console.error('Failed to delete photo', error);
                                                        alert('Failed to delete photo');
                                                    }
                                                }}
                                                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-lg"
                                                title="Delete photo"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Detailed Metrics */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Metrics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatBox label="Avg Speed" value={(activity.distance / (activity.duration > 0 ? activity.duration / 3600 : 1)).toFixed(1)} unit="km/h" />
                            <StatBox label="Max Speed" value="--" unit="km/h" />
                            <StatBox label="Avg Heart Rate" value={activity.avgHeartRate || '--'} unit="bpm" icon={<Heart size={14} className="text-red-500" />} />
                            <StatBox label="Max Heart Rate" value={activity.maxHeartRate || '--'} unit="bpm" />
                            <StatBox label="Avg Power" value={activity.avgPower || '--'} unit="watts" icon={<Zap size={14} className="text-yellow-500" />} />
                            <StatBox label="Active Calories" value={Math.round(activity.calories || 0)} unit="kcal" />
                            <StatBox label="Elevation" value={activity.elevationGain || '--'} unit="m" />
                            <StatBox label="Training Load" value="--" unit="TSS" />
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-md">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-indigo-100 text-sm font-medium mb-1">Distance</p>
                                <p className="text-3xl font-bold">{activity.distance} <span className="text-base font-normal opacity-80">km</span></p>
                            </div>
                            <div>
                                <p className="text-indigo-100 text-sm font-medium mb-1">Duration</p>
                                <p className="text-3xl font-bold">{formatDuration(activity.duration)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Description</h3>
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                            {activity.description || 'No description provided.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Edit Activity</h2>
                            <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Title</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    value={editForm.title}
                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg p-2 h-32 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                                    value={editForm.description}
                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

function StatBox({ label, value, unit, icon }: any) {
    return (
        <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">{icon} {label}</p>
            <p className="text-lg font-bold text-gray-900">{value} <span className="text-xs font-normal text-gray-500">{unit}</span></p>
        </div>
    );
}

function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
}

function CustomLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    )
}
