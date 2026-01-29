'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Trash2, Trophy, Eye, Plus, Globe } from 'lucide-react';
import Link from 'next/link';
import CreateChallengeForm from '@/components/forms/CreateChallengeForm';

export default function ChallengesManagement() {
    const { user, loading } = useAuth();
    const [challenges, setChallenges] = useState<any[]>([]);
    const [showCreate, setShowCreate] = useState(false);

    // Edit state
    const [editingChallenge, setEditingChallenge] = useState<any>(null);

    useEffect(() => {
        if (!loading && user?.role === 'ADMIN') {
            fetchChallenges();
        }
    }, [user, loading]);

    const fetchChallenges = async () => {
        try {
            const res = await api.get('/challenges'); // Get all challenges
            setChallenges(res.data);
        } catch (error) {
            console.error('Failed to fetch challenges', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this challenge? This cannot be undone.')) return;
        try {
            await api.delete(`/challenges/${id}`);
            setChallenges(challenges.filter(c => c.id !== id));
        } catch (error) {
            alert('Failed to delete challenge');
        }
    };

    // Open edit modal
    const handleEdit = (challenge: any) => {
        setEditingChallenge(challenge);
        setShowCreate(false); // Ensure create is closed
    };

    if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Challenge Management</h1>
                        <p className="text-gray-500">View and manage all system challenges.</p>
                    </div>
                    <button
                        onClick={() => {
                            setShowCreate(!showCreate);
                            setEditingChallenge(null);
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
                    >
                        <Plus size={20} />
                        {showCreate ? 'Cancel' : 'Create Global Challenge'}
                    </button>
                </div>

                {/* Create Modal */}
                {showCreate && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 z-[60]" onClick={() => setShowCreate(false)}>
                        <div onClick={e => e.stopPropagation()}>
                            <CreateChallengeForm
                                groupId={null} // Global Challenge
                                onSuccess={() => {
                                    setShowCreate(false);
                                    fetchChallenges();
                                }}
                                onCancel={() => setShowCreate(false)}
                            />
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {editingChallenge && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 z-[60]" onClick={() => setEditingChallenge(null)}>
                        <div onClick={e => e.stopPropagation()}>
                            <CreateChallengeForm
                                isEditing={true}
                                initialData={editingChallenge}
                                groupId={editingChallenge.groupId} // Pass existing group ID
                                onSuccess={() => {
                                    setEditingChallenge(null);
                                    fetchChallenges();
                                }}
                                onCancel={() => setEditingChallenge(null)}
                            />
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Challenge</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Scope</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Participants</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {challenges.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                <Trophy size={20} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{c.title}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-[200px]">{c.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {c.group ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                Group: {c.group.name}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                <Globe size={12} /> Global
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {c._count?.participants || 0}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${new Date(c.endDate) < new Date() ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                            {new Date(c.endDate) < new Date() ? 'Ended' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(c)}
                                            className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-lg transition text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <Link
                                            href={`/challenges/${c.id}`}
                                            className="text-gray-500 hover:text-indigo-600 p-2 hover:bg-gray-100 rounded-lg transition"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(c.id)}
                                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                                            title="Delete Challenge"
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
