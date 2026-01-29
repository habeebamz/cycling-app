'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Trash2, Shield, Check } from 'lucide-react';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';

export default function GroupsManagement() {
    const { user, loading } = useAuth();
    const [groups, setGroups] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'ALL' | 'GROUP' | 'CLUB'>('ALL');

    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentGroup, setCurrentGroup] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', description: '', type: 'GROUP', isPrivate: false, image: '', profileImage: '' });

    useEffect(() => {
        if (!loading && user && ['ADMIN', 'MANAGER', 'EDITOR'].includes(user.role)) {
            fetchGroups();
        }
    }, [user, loading]);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/admin/groups');
            setGroups(res.data);
        } catch (error) {
            console.error('Failed to fetch groups', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this group?')) return;
        try {
            await api.delete(`/admin/groups/${id}`);
            setGroups(groups.filter(g => g.id !== id));
        } catch (error) {
            alert('Failed to delete group');
        }
    };

    const handleStatus = async (id: string, status: string) => {
        try {
            await api.patch(`/admin/groups/${id}/status`, { status });
            setGroups(groups.map(g => g.id === id ? { ...g, status } : g));
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const openCreate = () => {
        setIsEdit(false);
        setFormData({ name: '', description: '', type: activeTab === 'CLUB' ? 'CLUB' : 'GROUP', isPrivate: false, image: '', profileImage: '' });
        setShowModal(true);
    };

    const openEdit = (group: any) => {
        setIsEdit(true);
        setCurrentGroup(group);
        setFormData({
            name: group.name,
            description: group.description,
            type: group.type,
            image: group.image || '',
            profileImage: group.profileImage || '',
            isPrivate: group.isPrivate || false
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEdit && currentGroup) {
                // Using generic update endpoint for now
                await api.patch(`/groups/${currentGroup.id}`, formData);

                // Refresh data to be safe
                await fetchGroups();
            } else {
                await api.post('/groups', formData);
                await fetchGroups();
            }
            setShowModal(false);
        } catch (error: any) {
            console.error('Operation failed', error);
            const msg = error.response?.data?.message || 'Operation failed';
            alert(msg);
        }
    };

    const filteredGroups = groups ? groups.filter(g => activeTab === 'ALL' || g.type === activeTab) : [];

    if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Groups & Clubs</h1>
                        <p className="text-gray-500">Manage community groups.</p>
                    </div>
                    {user?.role === 'ADMIN' && (
                        <button
                            onClick={openCreate}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                        >
                            Create New
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('ALL')}
                        className={`pb-2 px-1 font-medium text-sm transition-colors border-b-2 ${activeTab === 'ALL' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setActiveTab('GROUP')}
                        className={`pb-2 px-1 font-medium text-sm transition-colors border-b-2 ${activeTab === 'GROUP' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Groups
                    </button>
                    <button
                        onClick={() => setActiveTab('CLUB')}
                        className={`pb-2 px-1 font-medium text-sm transition-colors border-b-2 ${activeTab === 'CLUB' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Clubs
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Type</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Members</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredGroups.length > 0 ? (
                                filteredGroups.map((g) => (
                                    <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{g.name}</div>
                                            <div className="text-xs text-gray-400">{g.description}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                {g.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {g._count?.members || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${g.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {g.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            {user?.role !== 'MANAGER' && (
                                                <button
                                                    onClick={() => openEdit(g)}
                                                    className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-lg text-sm font-medium"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleStatus(g.id, g.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED')}
                                                className="text-yellow-600 hover:text-yellow-800 p-2 hover:bg-yellow-50 rounded-lg"
                                            >
                                                <Shield size={18} />
                                            </button>
                                            {user?.role === 'ADMIN' && (
                                                <button
                                                    onClick={() => handleDelete(g.id)}
                                                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                        No groups found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">{isEdit ? 'Edit Group' : 'Create New Group'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="GROUP">Group</option>
                                        <option value="CLUB">Club</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                        value={formData.description || ''}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                        value={formData.image || ''}
                                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="text"
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                            value={formData.profileImage || ''}
                                            onChange={e => setFormData({ ...formData, profileImage: e.target.value })}
                                            placeholder="https://..."
                                        />
                                        <ProfilePictureUpload onUploadComplete={(url) => setFormData({ ...formData, profileImage: url })} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isPrivate"
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                        checked={formData.isPrivate}
                                        onChange={e => setFormData({ ...formData, isPrivate: e.target.checked })}
                                    />
                                    <label htmlFor="isPrivate" className="text-sm text-gray-700">Private (Invite only)</label>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700"
                                    >
                                        {isEdit ? 'Save Changes' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
