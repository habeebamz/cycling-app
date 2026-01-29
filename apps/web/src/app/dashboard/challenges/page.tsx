'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import CreateChallengeForm from '@/components/forms/CreateChallengeForm';
import { Plus, Trophy, Calendar, Users, Edit, Trash } from 'lucide-react';
import Link from 'next/link';

export default function ChallengesPage() {
    const { user } = useAuth();
    const [challenges, setChallenges] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState(false); // Does user manage ANY group?
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingChallenge, setEditingChallenge] = useState<any | null>(null);

    useEffect(() => {
        fetchChallenges();
        checkAdminStatus();
    }, []);

    const fetchChallenges = async () => {
        try {
            // Get challenges from groups user is in
            const res = await api.get('/challenges/my-groups');
            setChallenges(res.data);
        } catch (error) {
            console.error('Failed to fetch challenges', error);
        }
    };

    const checkAdminStatus = async () => {
        try {
            const res = await api.get('/users/me/groups?role=ADMIN');
            if (res.data && res.data.length > 0) {
                setIsAdmin(true);
            }
        } catch (error) {
            console.error('Failed to check admin status', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this challenge?')) return;
        try {
            await api.delete(`/challenges/${id}`);
            setChallenges(challenges.filter(c => c.id !== id));
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to delete challenge');
        }
    };

    const handleJoin = async (id: string) => {
        try {
            await api.post(`/challenges/${id}/join`);
            fetchChallenges(); // Refresh to see progress
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to join challenge');
        }
    };

    const handleLeave = async (id: string) => {
        if (!confirm('Are you sure you want to leave this challenge? Your progress will be lost.')) return;
        try {
            await api.post(`/challenges/${id}/leave`);
            fetchChallenges();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to leave challenge');
        }
    };

    const getGoalText = (challenge: any) => {
        switch (challenge.type) {
            case 'DISTANCE': return `${challenge.goal} km`;
            case 'TIME': return `${challenge.goal} hours`;
            case 'ELEVATION': return `${challenge.goal} m`;
            case 'RIDES': return `${challenge.goal} rides`;
            default: return challenge.goal;
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Challenges</h1>
                    <p className="text-gray-600 mt-2">Join challenges to push your limits.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => {
                            setEditingChallenge(null);
                            setShowCreateModal(true);
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-indigo-700 flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Create Challenge
                    </button>
                )}
            </div>

            {/* Challenges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {challenges.map((challenge) => (
                    <div key={challenge.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative">
                        {challenge.image ? (
                            <div className="h-32 w-full relative">
                                <img
                                    src={`http://localhost:3001${challenge.image}`}
                                    alt={challenge.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            </div>
                        ) : (
                            <div className="h-32 bg-orange-100 flex items-center justify-center">
                                <Trophy size={48} className="text-orange-500 opacity-50" />
                            </div>
                        )}

                        <div className="p-6 relative">
                            {/* Edit/Delete Actions - Restricted:
                                - Global Challenges: System Admin only
                                - Group Challenges: Creator or Group Admin (of any group for now, keeping legacy behavior) OR System Admin
                             */}
                            {user && (
                                (
                                    (!challenge.group && !challenge.groupId) ? user.role === 'ADMIN' : (challenge.creatorId === user.id || isAdmin || user.role === 'ADMIN')
                                )
                            ) && (
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingChallenge(challenge);
                                                setShowCreateModal(true);
                                            }}
                                            className="p-1 bg-white/90 rounded text-gray-600 hover:text-indigo-600 shadow-sm"
                                            title="Edit"
                                            type="button"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(challenge.id)}
                                            className="p-1 bg-white/90 rounded text-gray-600 hover:text-red-600 shadow-sm"
                                            title="Delete"
                                            type="button"
                                        >
                                            <Trash size={14} />
                                        </button>
                                    </div>
                                )}

                            <div className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-wide">{challenge.group?.name || 'Global Challenge'}</div>
                            <Link href={`/challenges/${challenge.id}`} className="hover:underline">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{challenge.title}</h3>
                            </Link>
                            <p className="text-gray-500 text-sm mb-4 line-clamp-2">{challenge.description}</p>

                            <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-2 text-sm mb-6">
                                <div>
                                    <div className="text-xs text-gray-400">Goal</div>
                                    <div className="font-bold text-gray-900">{getGoalText(challenge)}</div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users size={14} className="text-gray-400" />
                                    <div className="font-bold text-gray-900">{challenge._count?.participants || 0}</div>
                                </div>
                                <div className="col-span-2 flex items-center gap-1 text-gray-500 text-xs">
                                    <Calendar size={12} />
                                    {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                                </div>
                            </div>

                            {/* Progress / Actions */}
                            {challenge.participants && challenge.participants.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-gray-700">Progress</span>
                                        <span className="text-indigo-600">
                                            {challenge.type === 'DISTANCE' && `${challenge.participants[0].progress.toFixed(1)} / ${challenge.goal} km`}
                                            {challenge.type === 'TIME' && `${(challenge.participants[0].progress / 3600).toFixed(1)} / ${challenge.goal} hrs`}
                                            {challenge.type === 'RIDES' && `${challenge.participants[0].progress} / ${challenge.goal} rides`}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, (challenge.participants[0].progress / (challenge.type === 'TIME' ? challenge.goal * 3600 : challenge.goal)) * 100)}%`
                                            }}
                                        ></div>
                                    </div>

                                    {challenge.participants[0].completed && (
                                        <div className="text-center text-green-600 font-bold text-sm py-1 bg-green-50 rounded">
                                            Challenge Completed! 🎉
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleLeave(challenge.id)}
                                        className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded font-medium transition-colors text-sm"
                                    >
                                        Leave Challenge
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleJoin(challenge.id)}
                                    className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-medium transition-colors"
                                >
                                    Join Challenge
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {challenges.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No active challenges found. {isAdmin ? 'Create one now!' : 'Join a club to see challenges.'}
                    </div>
                )}
            </div>

            {/* Create Challenge Modal Overlay */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <CreateChallengeForm
                        initialData={editingChallenge}
                        isEditing={!!editingChallenge}
                        onSuccess={() => {
                            setShowCreateModal(false);
                            fetchChallenges();
                        }}
                        onCancel={() => setShowCreateModal(false)}
                    />
                </div>
            )}
        </DashboardLayout>
    );
}

// Temporary internal definition for 'loading' if not used from state
const loading = false; 
