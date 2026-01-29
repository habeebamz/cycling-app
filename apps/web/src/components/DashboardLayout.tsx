import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import NotificationDropdown from './dashboard/NotificationDropdown';
// import MessageInbox from './dashboard/MessageInbox';
import GlobalSearch from './dashboard/GlobalSearch';
import UserDropdown from './dashboard/UserDropdown';
import { Zap, Menu, X, Home, User, Activity, Trophy, BarChart2, Users, Calendar, Flag, Award, PlusCircle, Upload, Plus } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Close mobile menu on route change
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'My Profile', href: `/cyclist/${user.username}`, icon: User },
        { name: 'Activities', href: '/dashboard/activities', icon: Activity },
        { name: 'Challenges', href: '/dashboard/challenges', icon: Trophy },
        { name: 'Awards', href: '/dashboard/awards', icon: Award },
        { name: 'Analysis', href: '/dashboard/analysis', icon: BarChart2 },
        { name: 'Groups', href: '/dashboard/groups', icon: Users },
        { name: 'Events', href: '/dashboard/events', icon: Calendar },
        { name: 'Clubs', href: '/dashboard/clubs', icon: Flag },
    ];

    const NavLinks = () => (
        <nav className="mt-6 px-4 space-y-2">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${isActive
                            ? 'bg-orange-50 text-orange-700'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <Icon size={20} className={isActive ? 'text-orange-500' : 'text-gray-400'} />
                        {item.name}
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-white shadow-xl hidden md:flex flex-col z-20">
                <div className="p-6">
                    <div className="flex items-center gap-2">
                        <div className="bg-orange-500 p-1.5 rounded-lg transform -skew-x-12">
                            <Zap className="text-white fill-white h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">CycleTrack</h1>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <NavLinks />
                </div>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-4 mb-4">
                        <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                            {user.image ? (
                                <img src={user.image.startsWith('http') ? user.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${user.image}`} alt={user.username} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-xs font-bold text-gray-500">{user.firstName?.[0]}</div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 py-2 px-4 rounded-lg transition duration-200 font-medium text-sm"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="bg-white shadow-sm md:hidden shrink-0 z-30 relative border-b border-gray-100">
                    <div className="px-2 py-3 flex justify-between items-center gap-2">
                        {/* Mobile Search */}
                        <div className="flex-1 min-w-0 max-w-[180px]">
                            <GlobalSearch className="!max-w-full" />
                        </div>

                        {/* Action Cluster */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <NotificationDropdown />

                            <div className="h-6 w-px bg-gray-200 mx-0.5"></div>

                            <UserDropdown />

                            <Link
                                href="/dashboard/upload"
                                className="ml-1 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200"
                            >
                                <Plus size={18} />
                            </Link>

                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors ml-1"
                            >
                                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Mobile Navigation Drawer */}
                {isMobileMenuOpen && (
                    <div className="absolute inset-0 z-40 md:hidden">
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>

                        {/* Drawer */}
                        <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className="bg-orange-500 p-1.5 rounded-lg transform -skew-x-12">
                                        <Zap className="text-white fill-white h-6 w-6" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">CycleTrack</h1>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto py-2">
                                <NavLinks />
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                                <div className="flex items-center gap-3 px-4 mb-4">
                                    <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                        {user.image ? (
                                            <img src={user.image.startsWith('http') ? user.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${user.image}`} alt={user.username} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-xs font-bold text-gray-500">{user.firstName?.[0]}</div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                                        <p className="text-xs text-gray-500">@{user.username}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={logout}
                                    className="w-full bg-white border border-gray-200 text-red-600 py-2 px-4 rounded-lg hover:bg-red-50 transition duration-200 font-medium text-sm shadow-sm"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Desktop Header */}
                <header className="bg-white shadow-sm hidden md:flex justify-between items-center px-8 py-3 shrink-0 z-40">
                    <div className="w-1/3">
                        <GlobalSearch />
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationDropdown />
                        {/* <MessageInbox /> */}

                        <div className="h-6 w-px bg-gray-200 mx-1"></div>

                        <UserDropdown />

                        <div className="relative group">
                            <button className="text-orange-600 hover:text-orange-700 transition-colors">
                                <PlusCircle size={32} strokeWidth={1.5} />
                            </button>

                            {/* Dropdown - Using group-hover for simplicity or state could be better, adhering to simple hover for now as requested 'like' screenshot which implies standard dropdown behavior */}
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 hidden group-hover:block z-50 animate-in fade-in zoom-in-95 duration-100">
                                <Link
                                    href="/dashboard/upload"
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500">
                                        <Upload size={16} />
                                    </div>
                                    <span className="font-medium">Upload activity</span>
                                </Link>

                                <Link
                                    href="/dashboard/upload"
                                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500">
                                        <Activity size={16} />
                                    </div>
                                    <span className="font-medium">Add manual entry</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
