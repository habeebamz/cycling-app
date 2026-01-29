'use client';

import React from 'react';
import { Trophy, Calendar, Zap, Clock, TrendingUp } from 'lucide-react';

interface StatsRowProps {
    label: string;
    userValue: React.ReactNode;
    opponentValue: React.ReactNode;
    unit?: string;
    bold?: boolean;
}

const StatsRow = ({ label, userValue, opponentValue, unit = '', bold = false }: StatsRowProps) => (
    <div className={`grid grid-cols-3 py-3 border-b border-gray-50 items-center ${bold ? 'font-bold bg-gray-50/50' : ''}`}>
        <div className="text-sm text-gray-600 pl-4">{label}</div>
        <div className="text-center text-sm font-semibold text-indigo-700">
            {userValue}{unit && ` ${unit}`}
        </div>
        <div className="text-center text-sm font-semibold text-gray-900">
            {opponentValue}{unit && ` ${unit}`}
        </div>
    </div>
);

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 px-4 py-4 bg-gray-50/50 border-b border-gray-100">
        <Icon className="h-4 w-4 text-gray-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</span>
    </div>
);

export default function ComparisonTable({ userStats, opponentStats, userProfile, opponentProfile }: any) {
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header with Avatars */}
            <div className="grid grid-cols-3 bg-white border-b border-gray-100 items-center">
                <div className="p-4 border-r border-gray-50">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">Side by Side Comparison</h3>
                </div>
                <div className="p-4 flex flex-col items-center gap-2 border-r border-gray-50">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 overflow-hidden ring-2 ring-indigo-50">
                        {userProfile.image ? (
                            <img src={userProfile.image.startsWith('http') ? userProfile.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${userProfile.image}`} className="h-full w-full object-cover" />
                        ) : <div className="h-full w-full flex items-center justify-center font-bold text-indigo-500">{userProfile.firstName?.[0]}</div>}
                    </div>
                    <span className="text-xs font-bold text-indigo-600">You</span>
                </div>
                <div className="p-4 flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden ring-2 ring-gray-50">
                        {opponentProfile.image ? (
                            <img src={opponentProfile.image.startsWith('http') ? opponentProfile.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${opponentProfile.image}`} className="h-full w-full object-cover" />
                        ) : <div className="h-full w-full flex items-center justify-center font-bold text-gray-400">{opponentProfile.firstName?.[0]}</div>}
                    </div>
                    <span className="text-xs font-bold text-gray-900 truncate max-w-full px-2">{opponentProfile.firstName}</span>
                </div>
            </div>

            {/* Last 4 Weeks */}
            <SectionHeader icon={Calendar} title="Last 4 Weeks" />
            <StatsRow label="Activities / Week" userValue={userStats.last4Weeks.count.toFixed(1)} opponentValue={opponentStats.last4Weeks.count.toFixed(1)} />
            <StatsRow label="Avg Distance / Week" userValue={userStats.last4Weeks.distance.toFixed(1)} opponentValue={opponentStats.last4Weeks.distance.toFixed(1)} unit="km" />
            <StatsRow label="Elev Gain / Week" userValue={userStats.last4Weeks.elevation.toFixed(0)} opponentValue={opponentStats.last4Weeks.elevation.toFixed(0)} unit="m" />
            <StatsRow label="Avg Time / Week" userValue={formatTime(userStats.last4Weeks.duration)} opponentValue={formatTime(opponentStats.last4Weeks.duration)} />

            {/* Best Efforts */}
            <SectionHeader icon={Trophy} title="Best Efforts" />
            <StatsRow label="Longest Ride" userValue={userStats.bestEfforts.longestRide.toFixed(1)} opponentValue={opponentStats.bestEfforts.longestRide.toFixed(1)} unit="km" />
            <StatsRow label="Biggest Climb" userValue={userStats.bestEfforts.biggestClimb.toFixed(0)} opponentValue={opponentStats.bestEfforts.biggestClimb.toFixed(0)} unit="m" />
            <StatsRow label="Total Elevation" userValue={userStats.bestEfforts.totalElevation.toFixed(0)} opponentValue={opponentStats.bestEfforts.totalElevation.toFixed(0)} unit="m" />

            {/* Current Year */}
            <SectionHeader icon={TrendingUp} title={new Date().getFullYear().toString()} />
            <StatsRow label="Activities" userValue={userStats.yearStats.count} opponentValue={opponentStats.yearStats.count} />
            <StatsRow label="Distance" userValue={userStats.yearStats.distance.toFixed(1)} opponentValue={opponentStats.yearStats.distance.toFixed(1)} unit="km" />
            <StatsRow label="Elev Gain" userValue={userStats.yearStats.elevation.toFixed(0)} opponentValue={opponentStats.yearStats.elevation.toFixed(0)} unit="m" />
            <StatsRow label="Time" userValue={formatTime(userStats.yearStats.duration)} opponentValue={formatTime(opponentStats.yearStats.duration)} />

            {/* All Time */}
            <SectionHeader icon={Zap} title="All-Time" />
            <StatsRow label="Activities" userValue={userStats.allTime.count} opponentValue={opponentStats.allTime.count} />
            <StatsRow label="Distance" userValue={userStats.allTime.distance.toFixed(1)} opponentValue={opponentStats.allTime.distance.toFixed(1)} unit="km" />
            <StatsRow label="Elev Gain" userValue={userStats.allTime.elevation.toFixed(0)} opponentValue={opponentStats.allTime.elevation.toFixed(0)} unit="m" />
            <StatsRow label="Time" userValue={formatTime(userStats.allTime.duration)} opponentValue={formatTime(opponentStats.allTime.duration)} />
        </div>
    );
}
