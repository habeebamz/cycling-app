'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import Link from 'next/link';

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startTime: '',
        location: '',
        image: '',
        isPrivate: false
    });
    const [loading, setLoading] = useState(false);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events');
            setEvents(res.data);
        } catch (error) {
            console.error('Failed to fetch events', error);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/events', formData);
            setShowCreateModal(false);
            setFormData({ title: '', description: '', startTime: '', location: '', image: '', isPrivate: false });
            fetchEvents();
        } catch (error) {
            console.error('Failed to create event', error);
            alert('Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Events</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-indigo-700"
                >
                    Create Event
                </button>
            </div>

            <div className="space-y-4">
                {events.map((event) => (
                    <div key={event.id} className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col md:flex-row gap-6 ${event.status === 'SUSPENDED' ? 'border-red-300 bg-red-50' : 'border-gray-100'}`}>
                        <div
                            className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-lg text-indigo-600 overflow-hidden relative bg-indigo-50 border border-indigo-100"
                        >
                            {event.profileImage ? (
                                <img
                                    src={event.profileImage.startsWith('http') ? event.profileImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${event.profileImage}`}
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center w-full h-full">
                                    <span className="text-xs font-bold uppercase">{new Date(event.startTime).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="text-xl font-bold">{new Date(event.startTime).getDate()}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                <Link href={`/events/${event.id}`} className="hover:text-indigo-600 transition">
                                    {event.title}
                                </Link>
                                {event.isPrivate && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Private</span>}
                                {event.status === 'SUSPENDED' && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">SUSPENDED</span>}
                            </h3>
                            <p className="text-sm text-gray-500 mb-1">{new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {event.location || 'Virtual'}</p>
                            <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-500 text-right">
                                <span className="block font-bold text-gray-900">{event._count?.participants || 0}</span>
                                Going
                            </div>
                            <Link href={`/events/${event.id}`}>
                                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
                                    View
                                </button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
            {events.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No upcoming events found. Create one to get started!
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Event</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
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
                                    placeholder="https://example.com/image.jpg"
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
                                <label htmlFor="isPrivate" className="text-sm text-gray-700">Private Event (Invite only)</label>
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
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
