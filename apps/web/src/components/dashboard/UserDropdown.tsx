'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ChevronDown, LogOut, User, Settings, Grid, Users } from 'lucide-react';

export default function UserDropdown() {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [displayUser, setDisplayUser] = useState(user);

    useEffect(() => {
        setDisplayUser(user);
        if (user?.username) {
            import('@/lib/api').then(({ default: api }) => {
                api.get(`/users/${user.username}`)
                    .then(res => setDisplayUser(res.data))
                    .catch(err => console.error('Failed to update header profile', err));
            });
        }
    }, [user]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (!user || !displayUser) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 hover:bg-gray-50 rounded-full p-1 transition-colors"
            >
                <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden ring-2 ring-transparent hover:ring-orange-100 transition-all">
                    {displayUser.image ? (
                        <img src={displayUser.image.startsWith('http') ? displayUser.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${displayUser.image}`} alt={displayUser.firstName ? `${displayUser.firstName} ${displayUser.lastName}'s Profile Picture` : "My Profile Picture"} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs font-bold text-gray-500">{displayUser.firstName?.[0]}</div>
                    )}
                </div>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="border-b border-gray-100 pb-2 mb-2">
                        <Link
                            href="/dashboard/find-friends"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-orange-600 font-medium hover:bg-orange-50 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Find Friends
                        </Link>
                    </div>

                    <Link
                        href={`/cyclist/${user.username}`}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        {/* <User size={16} /> */}
                        My Profile
                    </Link>

                    <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        {/* <Settings size={16} /> */}
                        Settings
                    </Link>





                    <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                            onClick={() => {
                                logout();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                        >
                            {/* <LogOut size={16} /> */}
                            Log Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
