'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface RightSidebarProps {
    challenges?: any[];
    userGroups?: any[];
}

const RightSidebar: React.FC<RightSidebarProps> = ({ challenges = [], userGroups = [] }) => {
    return (
        <div className="space-y-6 sticky top-6">
            {/* Challenges Widget */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Challenges</h3>
                    <Link href="/dashboard/challenges" className="text-orange-600 text-xs font-medium hover:underline">
                        View All
                    </Link>
                </div>

                {challenges.length > 0 ? (
                    <div className="space-y-4">
                        {challenges.slice(0, 2).map(challenge => (
                            <div key={challenge.id} className="flex items-start gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg text-orange-600 shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{challenge.title}</h4>
                                    <p className="text-xs text-gray-500 mb-1">{challenge.goal} {challenge.type === 'DISTANCE' ? 'km' : ''}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-3">Join a run or cycling Challenge to stay on top of your game.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Clubs/Groups Widget */}
            <div>
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Your Clubs & Groups</h3>
                {userGroups && userGroups.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                        {userGroups.map((group) => (
                            <Link href={group.type === 'CLUB' ? `/clubs/${group.id}` : `/groups/${group.id}`} key={group.id} title={group.name}>
                                <div className="aspect-square bg-gray-200 rounded-md overflow-hidden relative group cursor-pointer hover:opacity-80 transition-opacity border border-gray-100">
                                    {group.profileImage ? (
                                        <img
                                            src={group.profileImage.startsWith('http') ? group.profileImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${group.profileImage}`}
                                            alt={group.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center text-white text-xs font-bold
                                            ${group.type === 'CLUB' ? 'bg-gradient-to-br from-indigo-400 to-purple-500' : 'bg-gradient-to-br from-blue-400 to-cyan-500'}`}>
                                            {group.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    {group.status === 'SUSPENDED' && (
                                        <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center">
                                            <span className="bg-red-600 w-2 h-2 rounded-full border border-white"></span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 italic">Not a member of any clubs yet.</div>
                )}

                <div className="flex gap-4 mt-4 text-sm font-medium text-gray-500">
                    <Link href="/dashboard/clubs" className="hover:text-indigo-600">
                        All Clubs
                    </Link>
                    <Link href="/dashboard/groups" className="hover:text-indigo-600">
                        All Groups
                    </Link>
                </div>
            </div>

            {/* Footer Links */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-400">
                <a href="#" className="hover:underline">About</a>
                <a href="#" className="hover:underline">Help</a>
                <a href="#" className="hover:underline">Blog</a>
                <a href="#" className="hover:underline">Terms</a>
                <a href="#" className="hover:underline">Privacy</a>
                <a href="#" className="hover:underline">Careers</a>
                <span>© 2026 Cycling App</span>
            </div>
        </div>
    );
};

export default RightSidebar;
