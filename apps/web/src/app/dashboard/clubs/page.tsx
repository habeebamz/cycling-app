'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import Link from 'next/link';

export default function ClubsPage() {
    const [clubs, setClubs] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', isPrivate: false });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClubs();
    }, []);

    const fetchClubs = async () => {
        try {
            const res = await api.get('/groups');
            // Filter only clubs (type='CLUB')
            const clubsOnly = res.data.filter((g: any) => g.type === 'CLUB');
            setClubs(clubsOnly);
        } catch (error) {
            console.error('Failed to fetch clubs', error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/groups', { ...formData, type: 'CLUB' });
            setShowCreateModal(false);
            setFormData({ name: '', description: '', isPrivate: false });
            fetchClubs();
        } catch (error) {
            console.error('Failed to create club', error);
            alert('Failed to create club');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Clubs</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-indigo-700"
                >
                    Create Club
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {clubs.map((club) => (
                    <div key={club.id} className={`bg-white rounded-xl shadow-sm border p-6 ${club.status === 'SUSPENDED' ? 'border-red-300 bg-red-50' : 'border-gray-100'}`}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center text-xl overflow-hidden shrink-0">
                                {club.profileImage ? (
                                    <img
                                        src={club.profileImage.startsWith('http') ? club.profileImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${club.profileImage}`}
                                        alt={club.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    '🛡️'
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    {club.name}
                                    {club.status === 'SUSPENDED' && <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded-full">SUSPENDED</span>}
                                </h3>
                                <p className="text-xs text-gray-500">{club._count?.members || 0} Members</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{club.description}</p>
                        <Link href={`/clubs/${club.id}`}>
                            <button className="w-full py-2 border border-indigo-600 text-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-50">
                                View Club
                            </button>
                        </Link>
                    </div>
                ))}
            </div>
            {clubs.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No clubs found. Be the first to create one!
                </div>
            )}

            <CreateClubModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreate}
                data={formData}
                setData={setFormData}
                loading={loading}
            />
        </DashboardLayout>
    );
}

// Simple Modal Component
function CreateClubModal({ show, onClose, onSubmit, data, setData, loading }: any) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Club</h2>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Club Name</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                            value={data.name}
                            onChange={e => setData({ ...data, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            rows={3}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                            value={data.description}
                            onChange={e => setData({ ...data, description: e.target.value })}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isPrivate"
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                            checked={data.isPrivate}
                            onChange={e => setData({ ...data, isPrivate: e.target.checked })}
                        />
                        <label htmlFor="isPrivate" className="text-sm text-gray-700">Private Club (Invite only)</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Club'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
