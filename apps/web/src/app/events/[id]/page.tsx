'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useParams } from 'next/navigation';
import { Calendar, MapPin, Users, Clock, Bell, BellOff } from 'lucide-react';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import { useAuth } from '@/context/AuthContext';
import InviteModal from '@/components/modals/InviteModal';
import ReportModal from '@/components/modals/ReportModal';
import { Flag } from 'lucide-react';

export default function EventDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isJoined, setIsJoined] = useState(false);
    const [joinLoading, setJoinLoading] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    // Form state
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editTime, setEditTime] = useState('');
    const [editImage, setEditImage] = useState('');
    const [editProfileImage, setEditProfileImage] = useState('');
    const [editIsPrivate, setEditIsPrivate] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await api.get(`/events/${id}`);
                setEvent(res.data);

                // Check notification status if user is participant
                if (res.data.participants && res.data.participants.length > 0) {
                    setIsJoined(true);
                    setNotificationsEnabled(res.data.participants[0].notificationsEnabled);
                } else {
                    setIsJoined(false);
                }

                const found = res.data;
                if (found) {
                    setEditTitle(found.title);
                    setEditDesc(found.description || '');
                    setEditLocation(found.location || '');
                    setEditImage(found.image || '');
                    setEditProfileImage(found.profileImage || '');
                    setEditIsPrivate(found.isPrivate || false);
                    // Format datetime for input
                    const date = new Date(found.startTime);
                    // simplistic conversion to local datetime-local string
                    const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                    setEditTime(localIso);
                }
            } catch (error) {
                console.error('Failed to fetch event details', error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchEvent();
    }, [id]);

    const handleToggleNotifications = async () => {
        try {
            const res = await api.post(`/events/${id}/notifications`);
            setNotificationsEnabled(res.data.enabled);
            alert(`Notifications ${res.data.enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error(error);
            alert('Failed to toggle notifications');
        }
    };

    const handleSaveEvent = async () => {
        try {
            await api.put(`/events/${id}`, {
                title: editTitle,
                description: editDesc,
                location: editLocation,
                startTime: new Date(editTime).toISOString(),
                image: editImage,
                profileImage: editProfileImage,
                isPrivate: editIsPrivate
            });
            setEvent({
                ...event,
                title: editTitle,
                description: editDesc,
                location: editLocation,
                startTime: new Date(editTime).toISOString(),
                image: editImage,
                profileImage: editProfileImage,
                isPrivate: editIsPrivate
            });
            setIsEditing(false);
            alert('Event updated successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to update event. You might not have permissions.');
        }
    };

    const handleDeleteEvent = async () => {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
        try {
            await api.delete(`/events/${id}`);
            alert('Event deleted');
            window.location.href = '/dashboard/events';
        } catch (error) {
            console.error(error);
            alert('Failed to delete event');
        }
    };

    const handleJoinEvent = async () => {
        setJoinLoading(true);
        try {
            await api.post('/events/join', { eventId: id, status: 'GOING' });
            setIsJoined(true);
            setEvent((prev: any) => ({
                ...prev,
                _count: {
                    ...prev._count,
                    participants: (prev._count?.participants || 0) + 1
                }
            }));
            alert('Joined event!');
        } catch (error) {
            console.error(error);
            alert('Failed to join');
        } finally {
            setJoinLoading(false);
        }
    }

    const handleLeaveEvent = async () => {
        setJoinLoading(true);
        try {
            await api.post('/events/leave', { eventId: id });
            setIsJoined(false);
            setEvent((prev: any) => ({
                ...prev,
                _count: {
                    ...prev._count,
                    participants: Math.max(0, (prev._count?.participants || 0) - 1)
                }
            }));
            alert('Left event');
        } catch (error) {
            console.error(error);
            alert('Failed to leave event');
        } finally {
            setJoinLoading(false);
        }
    }

    if (loading) return <div>Loading...</div>;
    if (!event) return <div>Event not found</div>;

    const isOwner = user?.id === event.creatorId;

    return (
        <DashboardLayout>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div
                    className="h-48 bg-cover bg-center relative"
                    style={{
                        backgroundImage: event.image ? `url(${event.image})` : 'none',
                        backgroundColor: event.image ? 'transparent' : '#4f46e5' // Fallback color
                    }}
                >
                    {!event.image && <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600"></div>}
                    {event.isPrivate && (
                        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold uppercase border border-white/20">
                            Private Event
                        </div>
                    )}
                    {event.status === 'SUSPENDED' && (
                        <div className="absolute inset-x-0 bottom-0 bg-red-600/90 text-white py-2 text-center font-bold">
                            ⚠️ This event has been suspended by an administrator.
                        </div>
                    )}
                </div>
                <div className="px-8 pb-8">
                    {event.status === 'SUSPENDED' ? (
                        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-12 text-center mt-6">
                            <div className="text-4xl mb-4">🚫</div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Event Suspended</h2>
                            <p className="text-gray-500 max-w-md mx-auto">
                                This event's details are currently unavailable because it has been suspended by an administrator.
                            </p>
                        </div>
                    ) : (
                        <>
                            {isEditing ? (
                                <div className="bg-gray-50 p-6 rounded-xl mb-6 border border-gray-200 space-y-4 max-w-2xl mx-auto mt-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Event Details</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                                            <input
                                                type="text"
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <textarea
                                                rows={4}
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                                                value={editDesc}
                                                onChange={(e) => setEditDesc(e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                                                    value={editTime}
                                                    onChange={(e) => setEditTime(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                                <input
                                                    type="text"
                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                                                    value={editLocation}
                                                    onChange={(e) => setEditLocation(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                                            <input
                                                type="text"
                                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                                                value={editImage}
                                                onChange={(e) => setEditImage(e.target.value)}
                                                placeholder="https://..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
                                            <div className="flex flex-col gap-2">
                                                <input
                                                    type="text"
                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border"
                                                    value={editProfileImage}
                                                    onChange={(e) => setEditProfileImage(e.target.value)}
                                                    placeholder="https://..."
                                                />
                                                <ProfilePictureUpload onUploadComplete={(url) => setEditProfileImage(url)} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="editIsPrivate"
                                                checked={editIsPrivate}
                                                onChange={(e) => setEditIsPrivate(e.target.checked)}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="editIsPrivate" className="text-sm text-gray-700">Private Event</label>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveEvent}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 font-medium"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                                        <div className="bg-white p-1 rounded-xl shadow-sm">
                                            <div className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center text-3xl font-bold text-blue-600 overflow-hidden">
                                                {event.profileImage ? (
                                                    <img
                                                        src={event.profileImage.startsWith('http') ? event.profileImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${event.profileImage}`}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    new Date(event.startTime).getDate()
                                                )}
                                            </div>
                                        </div>
                                        {isJoined ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setShowInviteModal(true)}
                                                    className="bg-white text-indigo-600 border border-indigo-100 px-4 py-2 rounded-md font-medium text-sm hover:bg-indigo-50 shadow-sm flex items-center gap-1.5 transition-colors"
                                                >
                                                    <Users size={16} />
                                                    Invite
                                                </button>
                                                <button
                                                    onClick={handleLeaveEvent}
                                                    disabled={joinLoading}
                                                    className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-md font-medium text-sm hover:bg-red-100 shadow-sm disabled:opacity-50 transition-colors"
                                                >
                                                    {joinLoading ? 'Leaving...' : 'Leave Event'}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleJoinEvent}
                                                disabled={joinLoading || event.status === 'SUSPENDED'}
                                                className={`px-4 py-2 rounded-md font-medium text-sm border shadow-sm transition-colors ${event.status === 'SUSPENDED'
                                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600'
                                                    }`}
                                            >
                                                {event.status === 'SUSPENDED' ? 'Suspended' : (joinLoading ? 'Joining...' : 'Join Event')}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowReportModal(true)}
                                            className="p-2 border border-gray-300 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                            title="Report Event"
                                        >
                                            <Flag size={20} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            {event.title}
                                            {event.isPrivate && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Private</span>}
                                            {event.status === 'SUSPENDED' && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">SUSPENDED</span>}
                                        </h1>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleToggleNotifications}
                                                className={`p-2 rounded-md transition-colors ${notificationsEnabled ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-gray-400 hover:bg-gray-100'}`}
                                                title={notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
                                            >
                                                {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                                            </button>
                                            {(isOwner || user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
                                                <button onClick={() => setIsEditing(true)} className="text-sm px-3 py-1.5 border border-indigo-200 text-indigo-600 rounded-md hover:bg-indigo-50">
                                                    Edit
                                                </button>
                                            )}
                                            {(isOwner || user?.role === 'ADMIN') && (
                                                <button onClick={handleDeleteEvent} className="text-sm px-3 py-1.5 border border-red-200 text-red-600 rounded-md hover:bg-red-50">
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-gray-600 mb-6">
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
                                            <Calendar size={18} className="text-indigo-500" />
                                            <span className="text-sm font-medium">{new Date(event.startTime).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
                                            <Clock size={18} className="text-indigo-500" />
                                            <span className="text-sm font-medium">{new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
                                            <MapPin size={18} className="text-indigo-500" />
                                            <span className="text-sm font-medium">{event.location || 'Virtual'}</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 leading-relaxed max-w-3xl">{event.description}</p>

                                    <div className="flex gap-6 mt-8 pt-6 border-t border-gray-100 text-sm text-gray-500">
                                        <span className="flex items-center gap-2 font-medium"><Users size={18} className="text-gray-400" /> {event._count?.participants || 0} Going</span>
                                        <span className="flex items-center gap-2 font-medium"><Users size={18} className="text-gray-400" /> Invites sent</span>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                {showInviteModal && (
                    <InviteModal
                        title={event.title}
                        targetId={event.id}
                        type="event"
                        onClose={() => setShowInviteModal(false)}
                    />
                )}

                {showReportModal && (
                    <ReportModal
                        isOpen={showReportModal}
                        onClose={() => setShowReportModal(false)}
                        entityId={event.id}
                        entityType="event"
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
