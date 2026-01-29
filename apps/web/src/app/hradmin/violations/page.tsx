
'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Trash2, CheckCircle, XCircle, ExternalLink, AlertTriangle, User, Calendar, MessageSquare } from 'lucide-react';

export default function ViolationsManagement() {
    const { user, loading } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [filter, setFilter] = useState('PENDING');

    useEffect(() => {
        if (!loading && user && user.role && ['ADMIN', 'MANAGER', 'EDITOR'].includes(user.role)) {
            fetchReports();
        }
    }, [user, loading]);

    const fetchReports = async () => {
        try {
            const res = await api.get('/admin/reports');
            setReports(res.data);
        } catch (error) {
            console.error('Failed to fetch reports', error);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await api.patch(`/admin/reports/${id}/status`, { status: newStatus });
            setReports(reports.map(r => r.id === id ? { ...r, status: newStatus } : r));
        } catch (error) {
            alert('Failed to update report status');
        }
    };

    const handleDeletePost = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post? This will also resolve the report.')) return;
        try {
            await api.delete(`/admin/reports/${id}/post`);
            setReports(reports.map(r => r.id === id ? { ...r, status: 'RESOLVED', post: null } : r));
            alert('Post deleted and report resolved');
        } catch (error) {
            alert('Failed to delete post');
        }
    };

    const handleDeleteActivity = async (id: string) => {
        if (!confirm('Are you sure you want to delete this activity? This will also resolve the report.')) return;
        try {
            await api.delete(`/admin/reports/${id}/activity`);
            setReports(reports.map(r => r.id === id ? { ...r, status: 'RESOLVED', activity: null } : r));
            alert('Activity deleted and report resolved');
        } catch (error) {
            alert('Failed to delete activity');
        }
    };

    const handleSuspendEntity = async (id: string, entityType: string) => {
        const confirmMessage = `Are you sure you want to suspend this ${entityType}? This will also resolve the report.`;
        if (!confirm(confirmMessage)) return;
        try {
            const res = await api.post(`/admin/reports/${id}/suspend`);
            setReports(reports.map(r => r.id === id ? { ...r, status: 'RESOLVED' } : r));
            alert(res.data.message || 'Entity suspended and report resolved');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to suspend entity');
        }
    };

    const handleSuspendAuthor = async (id: string) => {
        if (!confirm('Are you sure you want to suspend the author? This will also resolve the report.')) return;
        try {
            const res = await api.post(`/admin/reports/${id}/suspend-author`);
            setReports(reports.map(r => r.id === id ? { ...r, status: 'RESOLVED' } : r));
            alert(res.data.message || 'Author suspended and report resolved');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to suspend author');
        }
    };

    const handleLiftBanFromAppeal = async (reportId: string, groupId: string, userId: string) => {
        if (!confirm('Are you sure you want to lift this ban?')) return;
        try {
            await api.post(`/groups/${groupId}/lift-ban`, { targetUserId: userId });
            setReports(reports.map(r => r.id === reportId ? { ...r, status: 'RESOLVED' } : r));
            alert('Ban lifted and request marked as resolved');
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to lift ban');
        }
    };

    const filteredReports = reports.filter(r => filter === 'ALL' || r.status === filter);

    if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

    const getImageUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                            <AlertTriangle className="text-red-500" size={32} />
                            Report Violations
                        </h1>
                        <p className="mt-2 text-gray-500 text-lg">Manage and review post violation reports from the community.</p>
                    </div>

                    <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1 self-start">
                        {['PENDING', 'RESOLVED', 'DISMISSED', 'ALL'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-6">
                    {filteredReports.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center animate-in fade-in duration-500">
                            <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                                <AlertTriangle size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">No reports found</h3>
                            <p className="text-gray-500">Everything looks clean! No pending violation reports in this category.</p>
                        </div>
                    ) : (
                        filteredReports.map((report) => (
                            <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group animate-in slide-in-from-bottom-4 duration-300">
                                <div className="flex flex-col lg:flex-row">
                                    {/* Report Info */}
                                    <div className="p-6 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-100 bg-gray-50/30">
                                        <div className="flex items-start justify-between mb-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${report.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                report.status === 'RESOLVED' ? 'bg-green-100 text-green-800 border-green-200' :
                                                    'bg-gray-100 text-gray-800 border-gray-200'
                                                }`}>
                                                {report.status}
                                            </span>
                                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">
                                            {(report as any).type === 'APPEAL' ? (
                                                <span className="flex items-center gap-2 text-orange-600">
                                                    <CheckCircle size={20} /> Ban Removal Request
                                                </span>
                                            ) : (
                                                report.reason
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-6 bg-white p-3 rounded-xl border border-gray-100 shadow-sm italic">
                                            "{report.details || 'No additional details provided.'}"
                                        </p>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center border border-indigo-200 overflow-hidden">
                                                    {report.reporter.image ? (
                                                        <img src={getImageUrl(report.reporter.image) || ''} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={16} />
                                                    )}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Reporter</div>
                                                    <div className="text-sm font-bold text-gray-900 truncate">@{report.reporter.username}</div>
                                                </div>
                                            </div>

                                            {report.post && (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center border border-red-200">
                                                        <User size={16} />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Post Author</div>
                                                        <div className="text-sm font-bold text-gray-900 truncate">@{report.post.user.username}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content & Actions */}
                                    <div className="p-6 lg:w-2/3 flex flex-col justify-between">
                                        <div className="mb-6">
                                            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
                                                <MessageSquare size={12} /> Reported Content
                                            </div>

                                            {report.post && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">POST</span>
                                                    </div>
                                                    <p className="text-gray-800 whitespace-pre-wrap">{report.post.content}</p>
                                                    {report.post.image && (
                                                        <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 max-w-sm">
                                                            <img
                                                                src={getImageUrl(report.post.image) || ''}
                                                                alt="Post content"
                                                                className="w-full h-auto object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {report.targetUser && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">USER PROFILE</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                                                            {report.targetUser.image ? (
                                                                <img src={getImageUrl(report.targetUser.image) || ''} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="text-gray-400" size={24} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900">@{report.targetUser.username}</div>
                                                            <div className="text-xs text-gray-500">{report.targetUser.email}</div>
                                                        </div>
                                                        <a href={`/cyclist/${report.targetUser.username}`} target="_blank" rel="noreferrer" className="ml-auto text-indigo-600 text-xs font-bold border border-indigo-200 px-3 py-1 rounded-full hover:bg-indigo-50">
                                                            View Profile
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            {report.activity && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">ACTIVITY</span>
                                                    </div>
                                                    <div className="font-bold text-gray-900 mb-1">{report.activity.title || 'Untitled Activity'}</div>
                                                    <div className="text-xs text-gray-500 mb-2">by @{report.activity.user?.username}</div>
                                                </div>
                                            )}

                                            {report.group && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">GROUP/CLUB</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-lg overflow-hidden border border-blue-200 flex items-center justify-center">
                                                            {report.group.image ? (
                                                                <img src={getImageUrl(report.group.image) || ''} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <MessageSquare className="text-blue-500" size={20} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900">{report.group.name}</div>
                                                            <div className="text-xs text-gray-500 font-medium">{report.group.type}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {report.event && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">EVENT</span>
                                                    </div>
                                                    <div className="font-bold text-gray-900">{report.event.title}</div>
                                                    <div className="text-xs text-gray-500">{new Date(report.event.startTime).toLocaleDateString()}</div>
                                                </div>
                                            )}

                                            {!report.post && !report.targetUser && !report.activity && !report.group && !report.event && (
                                                <div className="bg-red-50 text-red-600 rounded-xl p-4 border border-red-100 flex items-center gap-2 italic">
                                                    <XCircle size={16} /> Content appears to be deleted.
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-gray-50">
                                            {report.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(report.id, 'DISMISSED')}
                                                        className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2 border border-gray-200"
                                                    >
                                                        <XCircle size={18} /> Dismiss Report
                                                    </button>

                                                    {report.post && user?.role === 'ADMIN' && (
                                                        <button
                                                            onClick={() => handleDeletePost(report.id)}
                                                            className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                                        >
                                                            <Trash2 size={18} /> Delete Post
                                                        </button>
                                                    )}

                                                    {report.activity && user?.role === 'ADMIN' && (
                                                        <button
                                                            onClick={() => handleDeleteActivity(report.id)}
                                                            className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                                        >
                                                            <Trash2 size={18} /> Delete Activity
                                                        </button>
                                                    )}

                                                    {(report.post || report.activity) && user?.role && ['ADMIN', 'MANAGER', 'EDITOR'].includes(user.role) && (
                                                        <button
                                                            onClick={() => handleSuspendAuthor(report.id)}
                                                            className="px-4 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                                        >
                                                            <XCircle size={18} /> Suspend Author
                                                        </button>
                                                    )}

                                                    {(report.targetUser || report.group || report.event) && user?.role && ['ADMIN', 'MANAGER', 'EDITOR'].includes(user.role) && (
                                                        <button
                                                            onClick={() => handleSuspendEntity(
                                                                report.id,
                                                                report.targetUser ? 'user' : report.group ? (report.group.type === 'CLUB' ? 'club' : 'group') : 'event'
                                                            )}
                                                            className="px-4 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                                        >
                                                            <XCircle size={18} /> Suspend {report.targetUser ? 'User' : report.group ? (report.group.type === 'CLUB' ? 'Club' : 'Group') : 'Event'}
                                                        </button>
                                                    )}

                                                    {report.status === 'PENDING' && (report as any).type === 'APPEAL' && (
                                                        <button
                                                            onClick={() => handleLiftBanFromAppeal(report.id, report.group.id, report.targetUser.id)}
                                                            className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                                        >
                                                            <CheckCircle size={18} /> Lift Ban
                                                        </button>
                                                    )}

                                                    {report.status === 'PENDING' && (report as any).type !== 'APPEAL' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(report.id, 'RESOLVED')}
                                                            className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                                        >
                                                            <CheckCircle size={18} /> Mark Resolved
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            {report.status !== 'PENDING' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(report.id, 'PENDING')}
                                                    className="px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-indigo-200"
                                                >
                                                    Reopen Report
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
