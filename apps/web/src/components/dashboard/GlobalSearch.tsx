'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface GlobalSearchProps {
    className?: string;
}

export default function GlobalSearch({ className }: GlobalSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length > 1) {
                performSearch(query);
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const performSearch = async (searchTerm: string) => {
        setLoading(true);
        setIsOpen(true);
        try {
            const queryParam = `query=${encodeURIComponent(searchTerm)}`;
            const [usersRes, groupsRes, eventsRes, challengesRes] = await Promise.allSettled([
                api.get(`/users?${queryParam}`),
                api.get(`/groups?${queryParam}`),
                api.get(`/events?${queryParam}`),
                api.get(`/challenges?${queryParam}`)
            ]);

            let allResults: any[] = [];

            // Users
            if (usersRes.status === 'fulfilled') {
                allResults.push(...usersRes.value.data.map((u: any) => ({
                    ...u, type: 'USER',
                    title: `${u.firstName} ${u.lastName}`,
                    subtitle: `@${u.username}`
                })));
            }

            // Groups (and Clubs)
            if (groupsRes.status === 'fulfilled') {
                allResults.push(...groupsRes.value.data.map((g: any) => ({
                    ...g,
                    type: g.type || 'GROUP', // 'GROUP' or 'CLUB'
                    title: g.name,
                    subtitle: `${g._count?.members || 0} members`
                })));
            }

            // Events
            if (eventsRes.status === 'fulfilled') {
                allResults.push(...eventsRes.value.data.map((e: any) => ({
                    ...e,
                    type: 'EVENT',
                    title: e.title,
                    subtitle: new Date(e.startTime).toLocaleDateString()
                })));
            }

            // Challenges
            if (challengesRes.status === 'fulfilled') {
                allResults.push(...challengesRes.value.data.map((c: any) => ({
                    ...c,
                    type: 'CHALLENGE',
                    title: c.title,
                    subtitle: c.group?.name ? `by ${c.group.name}` : 'Global Challenge'
                })));
            }

            // Limit total results if needed, or by category? 
            // Let's just show everything, maybe sort by relevance (name match)?
            // For now, simple list.
            setResults(allResults);

        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item: any) => {
        setIsOpen(false);
        setQuery('');
        // Navigate based on type
        if (item.type === 'USER') {
            router.push(`/cyclist/${item.username}`);
        } else {
            // ... mix of other types if we add them back ...
            switch (item.type) {
                case 'CLUB': router.push(`/clubs/${item.id}`); break;
                case 'CHALLENGE': router.push(`/dashboard/challenges`); break;
                case 'GROUP': router.push(`/groups/${item.id}`); break;
                case 'EVENT': router.push(`/events/${item.id}`); break;
            }
        }
    };

    return (
        <div className={`relative w-full ${className || ''}`} ref={searchRef}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs transition-all"
                    placeholder="Search..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (query.trim().length > 1) setIsOpen(true);
                    }}
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {isOpen && (query.trim().length > 1) && (
                <div className="absolute mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-100 py-1 z-50 overflow-hidden">
                    {loading ? (
                        <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
                    ) : results.length > 0 ? (
                        <ul>
                            <li className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                                Suggestions
                            </li>
                            {results.map((item) => (
                                <li key={`${item.type}-${item.id || item.username}`}>
                                    <button
                                        onClick={() => handleSelect(item)}
                                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center gap-3 transition-colors"
                                    >
                                        <div className={`
                                            h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden
                                            ${item.type === 'CLUB' ? 'bg-purple-500' : ''}
                                            ${item.type === 'CHALLENGE' ? 'bg-orange-500' : ''}
                                            ${item.type === 'GROUP' ? 'bg-blue-500' : ''}
                                            ${item.type === 'EVENT' ? 'bg-green-500' : ''}
                                            ${item.type === 'USER' ? 'bg-gray-200' : ''}
                                        `}>
                                            {item.type === 'USER' || item.type === 'CLUB' || item.type === 'GROUP' || item.type === 'EVENT' ? (
                                                (item.image || item.profileImage) ? (
                                                    <img
                                                        src={(item.profileImage || item.image).startsWith('http') ? (item.profileImage || item.image) : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${item.profileImage || item.image}`}
                                                        alt={item.type === 'USER' ? `${item.title}'s Profile Picture` : item.title}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-white text-xs font-bold transformscale-up">
                                                        {item.type === 'CLUB' ? '🛡️' : item.type === 'GROUP' ? '👥' : item.type === 'EVENT' ? '📅' : item.firstName?.[0]}
                                                    </div>
                                                )
                                            ) : (
                                                item.type[0]
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{item.title}</div>
                                            <div className="text-xs text-gray-500">{item.subtitle}</div>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">No results found.</div>
                    )}
                </div>
            )}
        </div>
    );
}
