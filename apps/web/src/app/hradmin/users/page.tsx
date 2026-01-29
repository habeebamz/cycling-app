
'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Trash2, BadgeCheck } from 'lucide-react';

export default function UserManagement() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        if (!loading && user?.role === 'ADMIN') {
            fetchUsers();
        }
    }, [user, loading]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            setUsers(users.filter(u => u.id !== id));
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const res = await api.patch(`/admin/users/${id}/status`, { status: newStatus });
            setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleVerify = async (id: string, isVerified: boolean) => {
        try {
            const res = await api.patch(`/admin/users/${id}/status`, { isVerified });
            setUsers(users.map(u => u.id === id ? { ...u, isVerified } : u));
        } catch (error) {
            alert('Failed to update verification');
        }
    };

    const handleRoleUpdate = async (id: string, newRole: string) => {
        try {
            await api.patch(`/admin/users/${id}/status`, { role: newRole });
            setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
        } catch (error) {
            alert('Failed to update role');
        }
    };

    if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                {/* Header matches layout */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500">View and manage all registered users.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">User Details</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Role</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Verified</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 flex items-center gap-2">
                                            {u.firstName} {u.lastName}
                                            {u.isVerified && <BadgeCheck size={16} className="text-blue-500 fill-blue-100" />}
                                        </div>
                                        <div className="text-sm text-gray-500">@{u.username}</div>
                                        <div className="text-xs text-gray-400">{u.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.status === 'SUSPENDED' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-green-100 text-green-800 border border-green-200'}`}>
                                            {u.status || 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative inline-block w-32">
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleUpdate(u.id, e.target.value)}
                                                className={`appearance-none block w-full px-3 py-1 pr-8 text-xs font-medium rounded-full border focus:outline-none focus:ring-2 focus:ring-offset-1 ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border-purple-200 focus:ring-purple-500' : 'bg-gray-100 text-gray-800 border-gray-200 focus:ring-gray-500'}`}
                                                disabled={u.id === user?.id || user?.role !== 'ADMIN'}
                                            >
                                                <option value="USER">User</option>
                                                <option value="MANAGER">Manager</option>
                                                <option value="EDITOR">Editor</option>
                                                {u.role === 'ADMIN' && <option value="ADMIN">Admin</option>}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.isVerified ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                <BadgeCheck size={14} className="fill-blue-100" />
                                                Verified
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">Not Verified</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                        {u.id !== user?.id && (
                                            <>
                                                {user?.role !== 'MANAGER' && (
                                                    <button
                                                        onClick={() => handleVerify(u.id, !u.isVerified)}
                                                        className={`p-2 rounded-lg transition text-xs font-medium border ${u.isVerified ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}
                                                    >
                                                        {u.isVerified ? 'Unverify' : 'Verify'}
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleStatusUpdate(u.id, u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED')}
                                                    className={`p-2 rounded-lg transition text-xs font-medium border ${u.status === 'SUSPENDED' ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100'}`}
                                                >
                                                    {u.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                                                </button>

                                                {user?.role === 'ADMIN' && (
                                                    <button
                                                        onClick={() => handleDelete(u.id)}
                                                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
