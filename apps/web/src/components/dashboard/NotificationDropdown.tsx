
"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Heart, MessageCircle, UserPlus, Activity, Camera, Trophy, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Cookies from 'js-cookie';

interface Notification {
    id: string;
    type: string;
    message: string;
    link: string | null;
    imageUrl: string | null;
    read: boolean;
    createdAt: string;
    sender?: {
        firstName: string;
        lastName: string;
        image: string;
    }
}

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markRead = async (id: string, link: string | null) => {
        try {
            await api.put(`/notifications/${id}/read`);

            // Update local state
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            setIsOpen(false);
            if (link) router.push(link);
        } catch (error) {
            console.error('Error marking as read', error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all read', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'LIKE': return <Heart size={16} className="text-pink-500 fill-pink-500" />;
            case 'COMMENT': return <MessageCircle size={16} className="text-blue-500" />;
            case 'MESSAGE': return <MessageCircle size={16} className="text-green-500" />;
            case 'FOLLOW': return <UserPlus size={16} className="text-indigo-500" />;
            case 'ACTIVITY': return <Activity size={16} className="text-orange-500" />;
            case 'PHOTO': return <Camera size={16} className="text-purple-500" />;
            case 'NEW_RECORD': return <Activity size={16} className="text-yellow-500" />;
            case 'CHALLENGE_COMPLETED': return <Trophy size={16} className="text-yellow-600" />;
            case 'CLUB_POST': return <Users size={16} className="text-indigo-600" />;
            default: return <Bell size={16} className="text-gray-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full ring-2 ring-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 ring-1 ring-black ring-opacity-5">
                    <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-800">
                                Mark all as read
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    onClick={() => markRead(notification.id, notification.link)}
                                    className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors flex items-start gap-3 ${!notification.read ? 'bg-indigo-50/50' : ''}`}
                                >
                                    <div className="mt-1 flex-shrink-0 relative">
                                        {notification.imageUrl ? (
                                            <img
                                                src={notification.imageUrl.startsWith('http') ? notification.imageUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${notification.imageUrl}`}
                                                alt=""
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                {getIcon(notification.type)}
                                            </div>
                                        )}
                                        {notification.imageUrl && (
                                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                                {getIcon(notification.type)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800">{notification.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(notification.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
