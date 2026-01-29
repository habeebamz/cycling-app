'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { Search, Users, MapPin, Calendar, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SearchPage() {
    const [activeTab, setActiveTab] = useState<'cyclists' | 'groups' | 'events'>('cyclists');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Debounce search? Or search on button? Let's search on effect with debounce.
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                handleSearch();
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, activeTab]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            if (activeTab === 'cyclists') endpoint = '/users';
            if (activeTab === 'groups') endpoint = '/groups';
            if (activeTab === 'events') endpoint = '/events';

            const res = await api.get(endpoint, {
                params: { query }
            });
            setResults(res.data);
        } catch (error) {
            console.error(error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Explore</h1>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm"
                    />
                </div>
            </div>

            <div className="border-b border-gray-200 mb-6">
                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab('cyclists')}
                        className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'cyclists' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Cyclists
                        {activeTab === 'cyclists' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'groups' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Groups
                        {activeTab === 'groups' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'events' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Events
                        {activeTab === 'events' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></div>}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((item) => (
                        <div key={item.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            {activeTab === 'cyclists' && (
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                        {item.image ? (
                                            <img src={item.image.startsWith('http') ? item.image : `http://localhost:3001${item.image}`} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold">{item.firstName?.[0]}</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate">{item.firstName} {item.lastName}</h3>
                                        <p className="text-sm text-gray-500 truncate">@{item.username}</p>
                                    </div>
                                    <Link href={`/cyclist/${item.username}`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full">
                                        <ArrowRight size={20} />
                                    </Link>
                                </div>
                            )}

                            {activeTab === 'groups' && (
                                <>
                                    <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{item.description}</p>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">{item._count.members} Members</span>
                                        <Link href={`/dashboard/groups/${item.id}`} className="text-indigo-600 font-medium hover:underline">View Group</Link>
                                    </div>
                                </>
                            )}

                            {activeTab === 'events' && (
                                <>
                                    <p className="text-xs font-semibold text-indigo-600 mb-1 uppercase tracking-wide">
                                        {new Date(item.startTime).toLocaleDateString()}
                                    </p>
                                    <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                                    <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                                        <MapPin size={14} /> {item.location}
                                    </p>
                                    <Link href={`/dashboard/events/${item.id}`} className="block w-full text-center py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                                        View Details
                                    </Link>
                                </>
                            )}
                        </div>
                    ))}
                    {!loading && results.length === 0 && query && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No {activeTab} found matching "{query}"
                        </div>
                    )}
                    {!loading && results.length === 0 && !query && (
                        <div className="col-span-full text-center py-12 text-gray-400">
                            Start typing to search for {activeTab}...
                        </div>
                    )}
                </div>
            )}
        </DashboardLayout>
    );
}
