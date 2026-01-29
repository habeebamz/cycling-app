'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Search, UserPlus, Check } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function FindFriendsPage() {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [following, setFollowing] = useState<Set<string>>(new Set());

    useEffect(() => {
        searchUsers('');
    }, []);

    const searchUsers = async (searchTerm: string) => {
        setLoading(true);
        try {
            const url = searchTerm.trim() ? `/users?query=${searchTerm}` : '/users';
            const res = await api.get(url);
            setResults(res.data);
        } catch (error) {
            console.error('Failed to search users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchUsers(query);
    };

    const handleFollow = async (userId: string) => {
        try {
            // Corrected API endpoint base on backend routes
            await api.post('/users/follow', { followingId: userId });
            setFollowing(prev => new Set(prev).add(userId));
        } catch (error) {
            console.error('Failed to follow user', error);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Find Friends</h1>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name or username..."
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Searching...</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.map((resultUser) => {
                            if (resultUser.id === user?.id) return null; // Don't show self
                            const isFollowing = following.has(resultUser.id); // In real app, check initial state too

                            return (
                                <div key={resultUser.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:shadow-sm transition-shadow">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                                            {resultUser.image ? (
                                                <img src={resultUser.image.startsWith('http') ? resultUser.image : `http://localhost:3001${resultUser.image}`} alt={resultUser.username} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold">{resultUser.firstName?.[0]}</div>
                                            )}
                                        </div>
                                        <div>
                                            <Link href={`/cyclist/${resultUser.username}`} className="font-bold text-gray-900 hover:underline">
                                                {resultUser.firstName} {resultUser.lastName}
                                            </Link>
                                            <div className="text-sm text-gray-500">@{resultUser.username}</div>
                                            {resultUser.city && <div className="text-xs text-gray-400 mt-0.5">{resultUser.city}, {resultUser.country}</div>}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleFollow(resultUser.id)}
                                        disabled={isFollowing}
                                        className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isFollowing
                                            ? 'bg-green-50 text-green-700 cursor-default'
                                            : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                                            }`}
                                    >
                                        {isFollowing ? (
                                            <>
                                                <Check size={16} />
                                                Following
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={16} />
                                                Follow
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : query && (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
                        No users found matching "{query}"
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
