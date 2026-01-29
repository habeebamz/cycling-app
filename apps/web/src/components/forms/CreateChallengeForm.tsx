'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';

interface CreateChallengeFormProps {
    groupId?: string; // If pre-selected (e.g. from club page)
    initialData?: any; // For editing
    isEditing?: boolean;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const CreateChallengeForm: React.FC<CreateChallengeFormProps> = ({ groupId, initialData, isEditing, onSuccess, onCancel }) => {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [photo, setPhoto] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'DISTANCE',
        condition: 'ACCUMULATIVE',
        goal: '',
        startDate: '',
        endDate: '',
        groupId: groupId || '',
        trophyImage: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                type: initialData.type || 'DISTANCE',
                condition: initialData.condition || 'ACCUMULATIVE',
                goal: initialData.goal ? String(initialData.goal) : '',
                startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
                endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
                groupId: initialData.groupId || '',
                trophyImage: initialData.trophyImage || ''
            });
        }

        // If no pre-selected group and not editing (or editing but want to see options?), fetch user's admin groups
        // When editing, groupId should be fixed/disabled usually, but we need to ensure we have the group option if we want to show it.
        if (!groupId || isEditing) {
            fetchAdminGroups();
        }
    }, [groupId, initialData, isEditing]);

    const fetchAdminGroups = async () => {
        try {
            const res = await api.get('/users/me/groups?role=ADMIN');
            setGroups(res.data);
            if (!formData.groupId && res.data.length > 0 && !isEditing) {
                setFormData(prev => ({ ...prev, groupId: res.data[0].id }));
            }
        } catch (error) {
            console.error('Failed to fetch admin groups', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let challengeId = initialData?.id;

            if (isEditing) {
                await api.put(`/challenges/${challengeId}`, formData);
            } else {
                const res = await api.post('/challenges', formData);
                challengeId = res.data.id;
            }

            if (photo && challengeId) {
                const photoData = new FormData();
                photoData.append('image', photo);
                await api.post(`/challenges/${challengeId}/photo`, photoData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            alert(`Challenge ${isEditing ? 'updated' : 'created'} successfully!`);
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} challenge`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">{isEditing ? 'Edit Challenge' : 'Create New Challenge'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Group Selection (if not pre-set) */}
                {!groupId && !initialData?.groupId && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Club</label>
                        <select
                            value={formData.groupId}
                            onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            required
                            disabled={isEditing}
                        >
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                        {groups.length === 0 && <p className="text-xs text-red-500 mt-1">You must be an admin of a club to create a challenge.</p>}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g. January 100k Gran Fondo"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover Photo</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                setPhoto(e.target.files[0]);
                            }
                        }}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    <p className="text-xs text-gray-400 mt-1">Optional. Uploading a new photo will replace the existing one.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="DISTANCE">Distance (km)</option>
                            <option value="TIME">Time (hours)</option>
                            <option value="ELEVATION">Elevation (m)</option>
                            <option value="RIDES">Ride Count</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
                        <input
                            type="number"
                            required
                            min="1"
                            value={formData.goal}
                            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                    <select
                        value={formData.condition}
                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="ACCUMULATIVE">Accumulative (Total across all rides)</option>
                        <option value="SINGLE">Single Ride (Must achieve in one go)</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            required
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            required
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trophy Image URL (Optional)</label>
                    <input
                        type="url"
                        placeholder="https://example.com/trophy.png"
                        value={formData.trophyImage}
                        onChange={(e) => setFormData({ ...formData, trophyImage: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Enter a URL to a custom trophy image for this challenge</p>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading || (!groupId && !isEditing && groups.length === 0)}
                        className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400"
                    >
                        {loading ? 'Saving...' : (isEditing ? 'Update Challenge' : 'Create Challenge')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateChallengeForm;
