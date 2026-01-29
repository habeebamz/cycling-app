'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Save, User, Bell, Shield, MapPin, Activity, Lock } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Password Change State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error' | '', text: string }>({ type: '', text: '' });

    const [formData, setFormData] = useState({
        email: '', // Add email
        firstName: '',
        lastName: '',
        city: '',
        country: '',
        bio: '',
        bikeModel: '',
        weight: '',
        height: '',
        dob: '',
        gender: '',
        notificationsEnabled: true,
        eventRemindersEnabled: true,
        isPublic: true
    });

    useEffect(() => {
        if (user?.username) {
            fetchSettings();
        }
    }, [user]);

    const fetchSettings = async () => {
        try {
            const res = await api.get(`/users/${user?.username}`);
            const data = res.data;
            setFormData({
                email: data.email || '',
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                city: data.city || '',
                country: data.country || '',
                bio: data.bio || '',
                bikeModel: data.bikeModel || '',
                weight: data.weight || '',
                height: data.height || '',
                dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
                gender: data.gender || '',
                notificationsEnabled: data.notificationsEnabled ?? true,
                eventRemindersEnabled: data.eventRemindersEnabled ?? true,
                isPublic: data.isPublic ?? true
            });
        } catch (error) {
            console.error('Failed to fetch settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await api.put('/users/profile', formData);
            setMessage({ type: 'success', text: 'Settings updated successfully' });

            // Wait a bit then clear message
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Failed to update settings', error);
            setMessage({ type: 'error', text: 'Failed to update settings' });
        } finally {
            setSaving(false);
        }
    };

    const handleSavePassword = async () => {
        setPasswordMessage({ type: '', text: '' }); // Clear previous messages

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' });
            return;
        }

        if (newPassword.length < 6) { // Example validation
            setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
            return;
        }

        try {
            await api.put('/auth/password', {
                currentPassword,
                newPassword,
            });
            setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
        } catch (error: any) {
            console.error('Failed to change password', error);
            setPasswordMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password.' });
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

                <form onSubmit={handleSubmit} className="space-y-8">


                    {/* Account Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <Shield className="text-green-600" size={24} />
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Account Settings</h2>
                                <p className="text-sm text-gray-500">Manage your login details</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address (Private)</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">Used for login and notifications. Not visible to other users.</p>
                        </div>
                    </div>

                    {/* Public Profile */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <User className="text-indigo-600" size={24} />
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Public Profile</h2>
                                <p className="text-sm text-gray-500">Information visible to other users</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location (City)</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bike Model</label>
                                <input
                                    type="text"
                                    name="bikeModel"
                                    value={formData.bikeModel}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g. Specialized Tarmac"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Physical Attributes */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <Activity className="text-orange-600" size={24} />
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Physical Stats</h2>
                                <p className="text-sm text-gray-500">Used for calculating calories and performance</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                                <input
                                    type="number"
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                                <input
                                    type="number"
                                    name="height"
                                    value={formData.height}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notifications & Privacy */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <Bell className="text-blue-600" size={24} />
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Notifications & Privacy</h2>
                                <p className="text-sm text-gray-500">Manage how you receive alerts and who sees you</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                                <div>
                                    <div className="font-medium text-gray-900">Enable Notifications</div>
                                    <div className="text-sm text-gray-500">Receive alerts for likes, comments, and followers</div>
                                </div>
                                <input
                                    type="checkbox"
                                    name="notificationsEnabled"
                                    checked={formData.notificationsEnabled}
                                    onChange={handleChange}
                                    className="h-5 w-5 text-indigo-600 rounded"
                                />
                            </label>

                            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                                <div>
                                    <div className="font-medium text-gray-900">Event Reminders</div>
                                    <div className="text-sm text-gray-500">Get reminded before events you've joined start</div>
                                </div>
                                <input
                                    type="checkbox"
                                    name="eventRemindersEnabled"
                                    checked={formData.eventRemindersEnabled}
                                    onChange={handleChange}
                                    className="h-5 w-5 text-indigo-600 rounded"
                                />
                            </label>

                            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                                <div>
                                    <div className="font-medium text-gray-900">Public Profile</div>
                                    <div className="text-sm text-gray-500">Visible on search & Google</div>
                                </div>
                                <input
                                    type="checkbox"
                                    name="isPublic"
                                    checked={formData.isPublic}
                                    onChange={handleChange}
                                    className="h-5 w-5 text-indigo-600 rounded"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <Lock className="text-indigo-600" size={24} />
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
                                <p className="text-sm text-gray-500">Update your account password</p>
                            </div>
                        </div>

                        <div className="space-y-4 max-w-md">
                            {passwordMessage.text && (
                                <div className={`text-sm p-3 rounded-md ${passwordMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                    {passwordMessage.text}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <input
                                    type="password"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <button
                                type="button" // Changed to type="button" to prevent form submission
                                onClick={handleSavePassword}
                                disabled={!currentPassword || !newPassword || !confirmPassword}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Update Password
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>

                    {message && (
                        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-lg text-white ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'} animate-in slide-in-from-bottom duration-300`}>
                            {message.text}
                        </div>
                    )}
                </form>
            </div>
        </DashboardLayout>
    );
}
