'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Upload, X, FileText, Activity } from 'lucide-react';

export default function UploadActivityPage() {
    const [mode, setMode] = useState<'manual' | 'file'>('file');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        distance: '',
        duration: '',
        date: '',
        time: ''
    });
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'manual') {
                const startTime = new Date(`${formData.date}T${formData.time}`);
                await api.post('/activities', {
                    title: formData.title,
                    description: formData.description,
                    distance: parseFloat(formData.distance),
                    duration: parseFloat(formData.duration) * 60,
                    startTime
                });
            } else {
                if (!file) return;
                const uploadData = new FormData();
                uploadData.append('file', file);
                // Optional: Allow title override
                if (formData.title) uploadData.append('title', formData.title);
                if (formData.description) uploadData.append('description', formData.description);

                await api.post('/activities/upload', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            router.push('/dashboard/activities');
        } catch (error) {
            console.error('Failed to upload activity', error);
            alert('Failed to upload activity');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Activity</h1>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => setMode('file')}
                            className={`flex-1 py-4 text-sm font-medium text-center ${mode === 'file' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            File Upload (GPX, TCX, FIT)
                        </button>
                        <button
                            onClick={() => setMode('manual')}
                            className={`flex-1 py-4 text-sm font-medium text-center ${mode === 'manual' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Manual Entry
                        </button>
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {mode === 'file' ? (
                                <div className="space-y-6">
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                                        {!file ? (
                                            <label className="cursor-pointer block">
                                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                                    Click to upload or drag and drop
                                                </span>
                                                <span className="mt-1 block text-xs text-gray-500">
                                                    .GPX, .TCX, or .FIT files
                                                </span>
                                                <input type="file" className="hidden" accept=".gpx,.tcx,.fit" onChange={handleFileChange} />
                                            </label>
                                        ) : (
                                            <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="text-indigo-600" />
                                                    <div className="text-left">
                                                        <div className="text-sm font-medium text-gray-900">{file.name}</div>
                                                        <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Optional Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                            placeholder="Leave empty to use filename/date"
                                            value={formData.title}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                            value={formData.title}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            name="description"
                                            rows={3}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                            value={formData.description}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Distance (km)</label>
                                            <input
                                                type="number"
                                                name="distance"
                                                step="0.01"
                                                required
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                                value={formData.distance}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                                            <input
                                                type="number"
                                                name="duration"
                                                required
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                                value={formData.duration}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Date</label>
                                            <input
                                                type="date"
                                                name="date"
                                                required
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                                value={formData.date}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Time</label>
                                            <input
                                                type="time"
                                                name="time"
                                                required
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                                value={formData.time}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || (mode === 'file' && !file)}
                                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? 'Uploading...' : 'Save Activity'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
