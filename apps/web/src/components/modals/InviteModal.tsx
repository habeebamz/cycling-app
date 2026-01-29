import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Check, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface User {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    image: string;
}

interface InviteModalProps {
    title: string;
    targetId: string;
    type: 'group' | 'club' | 'event';
    onClose: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ title, targetId, type, onClose }) => {
    const [mounted, setMounted] = useState(false);
    const [friends, setFriends] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';
        fetchFriends();
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const fetchFriends = async () => {
        try {
            const res = await api.get('/users/me/friends');
            setFriends(res.data);
        } catch (error) {
            console.error('Failed to fetch friends:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUser = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const toggleSelectAll = () => {
        const allFilteredIds = filteredFriends.map(f => f.id);
        const allFilteredSelected = allFilteredIds.every(id => selectedUsers.has(id));

        const newSelected = new Set(selectedUsers);
        if (allFilteredSelected) {
            // Deselect all in current view
            allFilteredIds.forEach(id => newSelected.delete(id));
        } else {
            // Select all in current view
            allFilteredIds.forEach(id => newSelected.add(id));
        }
        setSelectedUsers(newSelected);
    };

    const handleSendInvites = async () => {
        if (selectedUsers.size === 0) return;
        setSending(true);
        try {
            const endpoint = type === 'event' ? '/events/invite' : '/groups/invite';
            const body = type === 'event'
                ? { eventId: targetId, inviteeIds: Array.from(selectedUsers) }
                : { groupId: targetId, inviteeIds: Array.from(selectedUsers) };

            await api.post(endpoint, body);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Failed to send invites:', error);
        } finally {
            setSending(false);
        }
    };

    if (!mounted) return null;

    const filteredFriends = friends.filter(f => {
        const search = searchQuery.toLowerCase();
        return (
            (f.firstName || '').toLowerCase().includes(search) ||
            (f.lastName || '').toLowerCase().includes(search) ||
            (f.username || '').toLowerCase().includes(search)
        );
    });

    const isAllFilteredSelected = filteredFriends.length > 0 && filteredFriends.every(f => selectedUsers.has(f.id));

    const modalContent = (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Invite Friends</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {success ? (
                    <div className="p-12 text-center animate-in zoom-in duration-300">
                        <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={40} />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">Invitations Sent!</h4>
                        <p className="text-gray-500">Your friends will be notified shortly.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-gray-100 space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search followers..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            {filteredFriends.length > 0 && (
                                <button
                                    onClick={toggleSelectAll}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors px-1"
                                >
                                    {isAllFilteredSelected
                                        ? 'Deselect All Visible'
                                        : `Select All Visible (${filteredFriends.length})`}
                                </button>
                            )}
                        </div>

                        <div className="p-2 overflow-y-auto flex-1 max-h-[400px]">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <Loader2 className="animate-spin mb-2" size={32} />
                                    <p className="text-sm">Loading friends...</p>
                                </div>
                            ) : filteredFriends.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <div className="text-4xl mb-3 opacity-20">👥</div>
                                    <p>No followers found.</p>
                                    <p className="text-xs mt-1">You can only invite people who follow you.</p>
                                </div>
                            ) : (
                                filteredFriends.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => toggleUser(user.id)}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer group transition-all"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                            {user.image ? (
                                                <img
                                                    src={user.image.startsWith('http') ? user.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${user.image}`}
                                                    className="h-full w-full object-cover"
                                                    alt={user.username}
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold bg-indigo-50">
                                                    {(user.firstName?.[0] || user.username?.[0] || '?').toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-900 truncate">
                                                {user.firstName || user.username} {user.lastName || ''}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">@{user.username}</div>
                                        </div>
                                        <div className={`h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all ${selectedUsers.has(user.id)
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                            : 'border-gray-200 group-hover:border-indigo-300'
                                            }`}>
                                            {selectedUsers.has(user.id) && <Check size={14} />}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-xl">
                            <span className="text-sm text-gray-500 font-medium">
                                {selectedUsers.size} selected
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={selectedUsers.size === 0 || sending}
                                    onClick={handleSendInvites}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95"
                                >
                                    {sending ? <Loader2 className="animate-spin" size={16} /> : 'Send Invites'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default InviteModal;
