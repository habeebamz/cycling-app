'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Trophy, MessageSquare, Send, MoreVertical, Pencil, Trash2, X, Check } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import ReportModal from './modals/ReportModal';
import { Flag } from 'lucide-react';

interface GroupPostCardProps {
    post: any;
    currentUser: any;
    targetId?: string | null;
    isSuspended?: boolean;
}

export default function GroupPostCard({ post, currentUser, targetId, isSuspended }: GroupPostCardProps) {
    const [likesCount, setLikesCount] = useState(post._count?.likes || 0);
    const [isLiked, setIsLiked] = useState(post.likes && post.likes.length > 0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [commentsCount, setCommentsCount] = useState(post._count?.comments || 0);

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [content, setContent] = useState(post.content);
    const [showMenu, setShowMenu] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const isAuthor = currentUser?.id === post.userId;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleLike = async () => {
        try {
            const res = await api.post(`/posts/${post.id}/like`);
            setIsLiked(res.data.liked);
            setLikesCount((prev: number) => res.data.liked ? prev + 1 : prev - 1);
        } catch (error) {
            console.error('Failed to toggle like', error);
        }
    };

    const fetchComments = async () => {
        if (!showComments) {
            setLoadingComments(true);
            setShowComments(true);
            try {
                const res = await api.get(`/posts/${post.id}/comments`);
                setComments(res.data);
            } catch (error) {
                console.error('Failed to fetch comments', error);
            } finally {
                setLoadingComments(false);
            }
        } else {
            setShowComments(false);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const res = await api.post(`/posts/${post.id}/comments`, { text: newComment });
            setComments([...comments, res.data]);
            setNewComment('');
            setCommentsCount((prev: number) => prev + 1);
        } catch (error) {
            console.error('Failed to add comment', error);
        }
    };

    const handleUpdate = async () => {
        if (!editContent.trim() || editContent === content) {
            setIsEditing(false);
            return;
        }

        try {
            const res = await api.put(`/posts/${post.id}`, { content: editContent });
            setContent(res.data.content);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update post', error);
            alert('Failed to update post');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            await api.delete(`/posts/${post.id}`);
            setIsDeleted(true);
        } catch (error) {
            console.error('Failed to delete post', error);
            alert('Failed to delete post');
        }
    };

    const isTarget = targetId === post.id;

    if (isDeleted) return null;

    return (
        <div
            id={`post-${post.id}`}
            className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-1000 ${isTarget ? 'border-indigo-500 ring-2 ring-indigo-200 ring-opacity-50 scale-[1.02] shadow-md' : 'border-gray-100'
                }`}
        >
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Link href={`/cyclist/${post.user?.username}`} className="h-10 w-10 bg-gray-100 rounded-full overflow-hidden shrink-0 border border-gray-100">
                            {post.user?.image ? (
                                <img
                                    src={post.user.image.startsWith('http') ? post.user.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${post.user.image}`}
                                    className="w-full h-full object-cover"
                                    alt={post.user.username}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase">
                                    {post.user?.firstName?.[0]}
                                </div>
                            )}
                        </Link>
                        <div>
                            <Link href={`/cyclist/${post.user?.username}`} className="font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                                {post.user?.firstName} {post.user?.lastName}
                            </Link>
                            <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </div>

                    {isAuthor ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <MoreVertical size={18} />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 animate-in fade-in zoom-in duration-100">
                                    <button
                                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <Pencil size={14} /> Edit
                                    </button>
                                    <button
                                        onClick={() => { handleDelete(); setShowMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <MoreVertical size={18} />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 animate-in fade-in zoom-in duration-100">
                                    <button
                                        onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Flag size={14} /> Report
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <div className="mb-4">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all min-h-[100px]"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                onClick={() => { setIsEditing(false); setEditContent(content); }}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-1 transition-colors"
                            >
                                <X size={14} /> Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-md flex items-center gap-1 transition-colors"
                            >
                                <Check size={14} /> Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="prose prose-sm max-w-none mb-4 text-gray-800 whitespace-pre-wrap">
                        {content}
                    </div>
                )}

                <div className="flex items-center gap-6 pt-4 border-t border-gray-50 text-gray-500 text-sm">
                    <button
                        onClick={toggleLike}
                        disabled={isSuspended}
                        className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-indigo-600 font-bold' : 'hover:text-indigo-600'} ${isSuspended ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isSuspended ? "You are suspended from this group" : ""}
                    >
                        <Trophy size={16} fill={isLiked ? "currentColor" : "none"} />
                        {likesCount} {likesCount === 1 ? 'Kudo' : 'Kudos'}
                    </button>
                    <button
                        onClick={fetchComments}
                        className={`flex items-center gap-1 hover:text-indigo-600 transition-colors ${showComments ? 'text-indigo-600 font-bold' : ''}`}
                    >
                        <MessageSquare size={16} /> {commentsCount} {commentsCount === 1 ? 'Comment' : 'Comments'}
                    </button>
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                    {loadingComments ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-4 mb-4">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 text-sm group/comment">
                                    <Link href={`/cyclist/${comment.user.username}`} className="shrink-0 pt-0.5">
                                        <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden ring-2 ring-white shadow-sm border border-gray-100">
                                            {comment.user.image ? (
                                                <img
                                                    src={comment.user.image.startsWith('http') ? comment.user.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${comment.user.image}`}
                                                    alt={comment.user.username}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold text-xs uppercase">
                                                    {comment.user.firstName?.[0]}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="flex-1">
                                        <div className="bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm inline-block max-w-[90%]">
                                            <Link
                                                href={`/cyclist/${comment.user.username}`}
                                                className="font-bold text-gray-900 hover:text-indigo-600 transition-colors mr-1 cursor-pointer"
                                            >
                                                {comment.user.firstName} {comment.user.lastName}:
                                            </Link>
                                            <span className="text-gray-700 whitespace-pre-wrap">{comment.text}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1 ml-1 flex items-center gap-2">
                                            {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && <div className="text-xs text-gray-400 italic text-center py-2">No comments yet.</div>}
                        </div>
                    )}

                    {!isSuspended ? (
                        <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-2">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 hidden sm:flex items-center justify-center text-indigo-700 font-bold text-xs uppercase shrink-0 overflow-hidden">
                                {currentUser?.image ? (
                                    <img
                                        src={currentUser.image.startsWith('http') ? currentUser.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${currentUser.image}`}
                                        className="h-full w-full object-cover"
                                        alt="me"
                                    />
                                ) : (
                                    currentUser?.firstName?.[0] || '?'
                                )}
                            </div>
                            <div className="flex-1 relative">
                                <input
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="w-full bg-white border border-gray-200 rounded-full py-1.5 px-4 text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    className="absolute right-1 top-1 p-1 text-indigo-600 disabled:text-gray-300 hover:bg-indigo-50 rounded-full transition-colors"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center py-2 text-xs text-orange-600 font-medium italic">
                            Commenting is disabled during suspension.
                        </div>
                    )}
                </div>
            )}

            <ReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                entityId={post.id}
                entityType="post"
            />
        </div>
    );
}
