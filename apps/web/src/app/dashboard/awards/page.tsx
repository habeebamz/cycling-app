'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Award, Trophy, Medal, Star } from 'lucide-react';
import Link from 'next/link';

export default function AwardsPage() {
    const [challenges, setChallenges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAwards = async () => {
            try {
                // Fetch completed/participating challenges
                // historical completed challenges are shown regardless of expiry
                const res = await api.get('/challenges/my-groups?completedOnly=true');
                setChallenges(res.data);
            } catch (error) {
                console.error('Failed to fetch awards', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAwards();
    }, []);

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-yellow-100 p-3 rounded-xl">
                        <Trophy className="text-yellow-600 h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Your Trophy Case</h1>
                        <p className="text-gray-500">Badges and awards from your completed challenges</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">Loading awards...</div>
                ) : challenges.filter((c: any) => c.participants?.[0]?.completed).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {challenges.filter((c: any) => c.participants?.[0]?.completed).map((challenge) => (
                            <Link href={`/challenges/${challenge.id}`} key={challenge.id} className="block">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center relative overflow-hidden group hover:shadow-md transition-shadow h-full">
                                    <div className="absolute top-0 right-0 p-2">
                                        <Star className="text-yellow-400 fill-yellow-400 h-5 w-5" />
                                    </div>

                                    <div className="h-24 w-24 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-full flex items-center justify-center mb-4 ring-4 ring-white shadow-sm overflow-hidden">
                                        {challenge.trophyImage ? (
                                            <img src={challenge.trophyImage} alt={challenge.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <Trophy className="text-yellow-500 h-10 w-10 drop-shadow-sm" />
                                        )}
                                    </div>

                                    <h3 className="font-bold text-gray-900 mb-1">{challenge.title}</h3>
                                    <p className="text-sm text-gray-500 mb-4">{challenge.type} • {challenge.goal} {challenge.type === 'DISTANCE' ? 'km' : ''}</p>

                                    <div className="mt-auto pt-4 border-t border-gray-50 w-full text-xs text-gray-400 text-center">
                                        Status: Completed
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                        <div className="inline-block p-4 bg-gray-50 rounded-full mb-4">
                            <Award className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Awards Yet</h3>
                        <p className="text-gray-500 mb-6">Join challenges and track your activities to earn trophies!</p>
                        <a href="/dashboard/challenges" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                            Find Challenges
                        </a>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
