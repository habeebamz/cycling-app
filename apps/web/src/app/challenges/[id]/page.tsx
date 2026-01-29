'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Trophy, Calendar, Users, ArrowLeft, Clock, MapPin, Activity, CheckCircle, Share2, Award } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ChallengeDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const id = params.id as string;

    const [challenge, setChallenge] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        fetchChallenge();
    }, [id]);

    const fetchChallenge = async () => {
        try {
            const res = await api.get(`/challenges/${id}`);
            setChallenge(res.data);
        } catch (error) {
            console.error('Failed to fetch challenge', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        setJoining(true);
        try {
            await api.post(`/challenges/${id}/join`);
            await fetchChallenge(); // Refresh to see update
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to join challenge');
        } finally {
            setJoining(false);
        }
    };

    const handleLeave = async () => {
        if (!confirm('Are you sure you want to leave? Your progress will be lost.')) return;
        setJoining(true);
        try {
            await api.post(`/challenges/${id}/leave`);
            await fetchChallenge();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to leave challenge');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!challenge) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <h2 className="text-xl font-bold text-gray-900">Challenge not found</h2>
                    <button onClick={() => router.back()} className="mt-4 text-indigo-600 hover:underline">Go Back</button>
                </div>
            </DashboardLayout>
        );
    }

    const { userProgress } = challenge;
    const isParticipant = !!userProgress;
    const progressPercent = userProgress
        ? Math.min(100, (userProgress.progress / (challenge.type === 'TIME' ? challenge.goal * 3600 : challenge.goal)) * 100)
        : 0;

    const getGoalText = () => {
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
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Challenges
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    {/* Cover Image */}
                    <div className="h-48 md:h-64 relative bg-gray-100">
                        {challenge.image ? (
                            <img
                                src={challenge.image.startsWith('http') ? challenge.image : `${process.env.NEXT_PUBLIC_API_URL}${challenge.image}`}
                                alt={challenge.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                                <Trophy size={64} className="text-indigo-200" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                        <div className="absolute bottom-6 left-6 text-white">
                            <div className="flex items-center gap-2 text-sm font-medium opacity-90 mb-2">
                                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full uppercase tracking-wider text-xs">
                                    {challenge.type} Challenge
                                </span>
                                {challenge.group && (
                                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs">
                                        {challenge.group.name}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold">{challenge.title}</h1>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Main Content */}
                            <div className="md:col-span-2 space-y-8">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 mb-3">About this Challenge</h2>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                        {challenge.description || "No description provided."}
                                    </p>
                                </div>

                                {/* Progress Section (Only if joined) */}
                                {isParticipant && (
                                    <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                                        <div className="flex justify-between items-end mb-4">
                                            <div>
                                                <h3 className="font-bold text-indigo-900 mb-1">Your Progress</h3>
                                                <p className="text-sm text-indigo-700">
                                                    {userProgress.completed ? "You've crushed this challenge!" : "Keep pushing!"}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-indigo-600">
                                                    {challenge.type === 'DISTANCE' && userProgress.progress.toFixed(1)}
                                                    {challenge.type === 'TIME' && (userProgress.progress / 3600).toFixed(1)}
                                                    {challenge.type === 'RIDES' && userProgress.progress}
                                                </div>
                                                <div className="text-xs text-indigo-500 uppercase font-bold">of {getGoalText()}</div>
                                            </div>
                                        </div>

                                        <div className="w-full bg-indigo-200 rounded-full h-3 mb-2">
                                            <div
                                                className="bg-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>

                                        {userProgress.completed && (
                                            <div className="mt-4 flex items-center justify-center gap-2 text-green-700 bg-green-100 py-2 rounded-lg font-bold">
                                                <CheckCircle size={20} />
                                                Challenge Completed
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">Leaderboard</h2>
                                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                                        {challenge.participants && challenge.participants.length > 0 ? (
                                            <div className="divide-y divide-gray-100">
                                                {challenge.participants.map((p: any, index: number) => (
                                                    <div key={p.userId} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                                        <div className="font-bold text-gray-400 w-6 text-center">{index + 1}</div>
                                                        <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                                                            {p.user.image ? (
                                                                <img src={p.user.image.startsWith('http') ? p.user.image : `${process.env.NEXT_PUBLIC_API_URL}${p.user.image}`} alt={p.user.username} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-bold">{p.user.firstName?.[0]}</div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-900">
                                                                {p.user.firstName} {p.user.lastName} {p.userId === user?.id && '(You)'}
                                                            </div>
                                                            {p.completed && (
                                                                <div className="text-xs text-green-600 font-bold flex items-center gap-1">
                                                                    <Award size={12} /> Completed
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="font-mono font-medium text-gray-700">
                                                            {challenge.type === 'DISTANCE' && `${p.progress.toFixed(1)} km`}
                                                            {challenge.type === 'TIME' && `${(p.progress / 3600).toFixed(1)} hr`}
                                                            {challenge.type === 'IDES' && `${p.progress} rides`}
                                                            {/* Fallback for others */}
                                                            {!['DISTANCE', 'TIME', 'RIDES'].includes(challenge.type) && p.progress}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-gray-500">
                                                No participants yet. Be the first to join!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Info */}
                            <div className="space-y-6">
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-4">Challenge Details</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <Activity className="text-gray-400 mt-0.5" size={18} />
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase font-bold">Goal</div>
                                                <div className="font-medium">{getGoalText()}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Calendar className="text-gray-400 mt-0.5" size={18} />
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase font-bold">Dates</div>
                                                <div className="font-medium text-sm">
                                                    {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Users className="text-gray-400 mt-0.5" size={18} />
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase font-bold">Participants</div>
                                                <div className="font-medium">{challenge._count?.participants || 0}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        {!isParticipant ? (
                                            <button
                                                onClick={handleJoin}
                                                disabled={joining}
                                                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                                            >
                                                {joining ? 'Joining...' : 'Join Challenge'}
                                            </button>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="text-center text-sm text-green-700 font-medium bg-green-50 py-2 rounded-lg border border-green-100">
                                                    You are participating
                                                </div>
                                                <button
                                                    onClick={handleLeave}
                                                    disabled={joining}
                                                    className="w-full bg-white text-red-600 py-2 rounded-lg font-medium border border-gray-200 hover:bg-red-50 transition-colors text-sm"
                                                >
                                                    {joining ? 'Processing...' : 'Leave Challenge'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
