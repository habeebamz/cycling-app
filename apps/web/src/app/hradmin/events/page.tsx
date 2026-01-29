'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function EventsManagement() {
    const { user, loading } = useAuth();
    const [events, setEvents] = useState<any[]>([]);

    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<any>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startTime: '',
        location: '',
        image: '',
        isPrivate: false
    });

    useEffect(() => {
        if (!loading && user && ['ADMIN', 'MANAGER', 'EDITOR'].includes(user.role as string)) {
            fetchEvents();
        }
    }, [user, loading]);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/admin/events');
            setEvents(res.data);
        } catch (error) {
            console.error('Failed to fetch events', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this event?')) return;
        try {
            await api.delete(`/admin/events/${id}`);
            setEvents(events.filter(e => e.id !== id));
        } catch (error) {
            alert('Failed to delete event');
        }
    };

    const handleStatus = async (id: string, status: string) => {
        try {
            await api.patch(`/admin/events/${id}/status`, { status });
            setEvents(events.map(e => e.id === id ? { ...e, status } : e));
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const openCreate = () => {
        setIsEdit(false);
        setFormData({ title: '', description: '', startTime: '', location: '', image: '', isPrivate: false });
        setShowModal(true);
    };

    const openEdit = (event: any) => {
        setIsEdit(true);
        setCurrentEvent(event);
        setFormData({
            title: event.title,
            description: event.description || '',
            startTime: event.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : '',
            location: event.location || '',
            image: event.profileImage || '',
            isPrivate: event.isPrivate || false
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEdit && currentEvent) {
                // Assuming generic update endpoint /events/[id] works for admins or using specific endpoint?
                // Using generic /events/[id] based on previous assumption.
                // NOTE: If this fails due to permissions, we'll need a dedicated admin updater.
                await api.patch(`/events/${currentEvent.id}`, formData);

                // Refresh list or optimistic update
                // Fetching fresh to ensure server state
                await fetchEvents();
            } else {
                await api.post('/events', formData);
                await fetchEvents();
            }
            setShowModal(false);
        } catch (error: any) {
            console.error('Operation failed', error);
            const msg = error.response?.data?.message || 'Operation failed';
            alert(msg);
        }
    };

    if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
                        <p className="text-gray-500">Manage scheduled events.</p>
                    </div>
                    {user?.role === 'ADMIN' && (
                        <button
                            onClick={openCreate}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                        >
                            Create New
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Event</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Organizer</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {events && events.length > 0 ? (
                                events.map((e) => (
                                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{e.title}</div>
                                            <div className="text-xs text-gray-400">{e.location || 'Virtual'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            @{e.creator?.username}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(e.startTime).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${e.status === 'CANCELLED' || e.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {e.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            {user?.role !== 'MANAGER' && (
                                                <button
                                                    onClick={() => openEdit(e)}
                                                    className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-lg text-sm font-medium"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleStatus(e.id, e.status === 'SUSPENDED' ? 'SCHEDULED' : 'SUSPENDED')}
                                                className="text-yellow-600 hover:text-yellow-800 p-2 hover:bg-yellow-50 rounded-lg"
                                                title="Suspend/Activate"
                                            >
                                                <AlertTriangle size={18} />
                                            </button>
                                            {user?.role === 'ADMIN' && (
                                                <button
                                                    onClick={() => handleDelete(e.id)}
                                                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                        No events found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">{isEdit ? 'Edit Event' : 'Create New Event'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                        value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        placeholder="City, Address, or Virtual Link"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                        value={formData.image}
                                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isPrivate"
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                        checked={formData.isPrivate}
                                        onChange={e => setFormData({ ...formData, isPrivate: e.target.checked })}
                                    />
                                    <label htmlFor="isPrivate" className="text-sm text-gray-700">Private Event</label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        rows={3}
                                        required
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700"
                                    >
                                        {isEdit ? 'Save Changes' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
