
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Shield, Users, Activity, BarChart2, LogOut, LayoutDashboard, Trophy, Settings, AlertTriangle } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    React.useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/hradmin/login');
            } else if (!user.role || !['ADMIN', 'MANAGER', 'EDITOR'].includes(user.role)) {
                router.push('/dashboard');
            } else {
                // Role-based redirects for inner pages
                if (user.role && ['MANAGER', 'EDITOR'].includes(user.role)) {
                    const restrictedPaths = ['/hradmin', '/hradmin/analysis', '/hradmin/users', '/hradmin/challenges', '/hradmin/activities', '/hradmin/settings'];
                    if (restrictedPaths.includes(pathname)) {
                        router.push('/hradmin/groups');
                    }
                }
            }
        }
    }, [user, loading, router, pathname]);

    if (loading || !user || !user.role || !['ADMIN', 'MANAGER', 'EDITOR'].includes(user.role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    const allNavItems = [
        { name: 'Overview', href: '/hradmin', icon: LayoutDashboard, roles: ['ADMIN'] },
        { name: 'Analysis', href: '/hradmin/analysis', icon: BarChart2, roles: ['ADMIN'] },
        { name: 'User Management', href: '/hradmin/users', icon: Users, roles: ['ADMIN'] },
        { name: 'Groups & Clubs', href: '/hradmin/groups', icon: Users, roles: ['ADMIN', 'MANAGER', 'EDITOR'] },
        { name: 'Challenges', href: '/hradmin/challenges', icon: Trophy, roles: ['ADMIN'] },
        { name: 'Events', href: '/hradmin/events', icon: Activity, roles: ['ADMIN', 'MANAGER', 'EDITOR'] },
        { name: 'Activities', href: '/hradmin/activities', icon: Activity, roles: ['ADMIN'] },
        { name: 'Violations', href: '/hradmin/violations', icon: AlertTriangle, roles: ['ADMIN', 'MANAGER', 'EDITOR'] },
        { name: 'Settings', href: '/hradmin/settings', icon: Settings, roles: ['ADMIN'] },
    ];

    const navItems = allNavItems.filter(item => user.role && item.roles.includes(user.role));

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 text-white shadow-xl flex flex-col z-20">
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-600 p-2 rounded-lg">
                            <Shield className="text-white h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Admin Portal</h1>
                            <p className="text-xs text-gray-400">System Administration</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm ${isActive
                                    ? 'bg-gray-800 text-white border-l-4 border-red-500'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <Icon size={20} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800 bg-gray-900">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="h-8 w-8 rounded-full bg-red-900 flex items-center justify-center text-red-200 font-bold text-xs ring-2 ring-gray-700">
                            {user.firstName?.[0]}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-gray-500 truncate capitalize">{user.role?.toLowerCase()}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-red-900/30 text-gray-300 hover:text-red-400 py-2 px-4 rounded-lg transition duration-200 font-medium text-sm border border-gray-700 hover:border-red-900"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="bg-white shadow-sm flex justify-between items-center px-8 py-4 z-10">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {allNavItems.find(i => i.href === pathname)?.name || 'Dashboard'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            System Online
                        </span>
                    </div>
                </header>
                <div className="flex-1 p-8 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
