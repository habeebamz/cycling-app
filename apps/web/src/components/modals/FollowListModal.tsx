import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Link from 'next/link';

interface FollowListModalProps {
    title: string;
    users: any[];
    onClose: () => void;
}

const FollowListModal: React.FC<FollowListModalProps> = ({ title, users, onClose }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Prevent scrolling on the body when modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                    {users.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <div className="text-4xl mb-3 opacity-20">👥</div>
                            <p>No {title.toLowerCase()} found.</p>
                        </div>
                    ) : (
                        users.map((user) => (
                            <Link
                                key={user.id}
                                href={`/cyclist/${user.username}`}
                                onClick={onClose}
                                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-all group"
                            >
                                <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden shrink-0 border-2 border-transparent group-hover:border-orange-500 transition-all">
                                    {user.image ? (
                                        <img
                                            src={user.image.startsWith('http') ? user.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${user.image}`}
                                            alt={`${user.firstName} ${user.lastName}'s Profile Picture`}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold text-lg">
                                            {user.firstName?.[0] || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{user.firstName} {user.lastName}</div>
                                    <div className="text-xs text-gray-500">@{user.username}</div>
                                </div>
                                <div className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-xs font-bold uppercase tracking-wider">View</button>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default FollowListModal;
