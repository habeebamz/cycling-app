'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminSettings() {
    const { user, loading } = useAuth();
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [emailSettings, setEmailSettings] = useState({
        SMTP_HOST: '',
        SMTP_PORT: '',
        SMTP_USER: '',
        SMTP_PASS: '',
        SMTP_FROM: '',
        TEMPLATE_WELCOME_SUBJECT: '',
        TEMPLATE_WELCOME_BODY: '',
        TEMPLATE_RESET_PASSWORD_SUBJECT: '',
        TEMPLATE_RESET_PASSWORD_BODY: '',
        TEMPLATE_RESET_SUCCESS_SUBJECT: '',
        TEMPLATE_RESET_SUCCESS_BODY: '',
        TEMPLATE_MONTHLY_REPORT_SUBJECT: '',
        TEMPLATE_MONTHLY_REPORT_BODY: ''
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (user) {
            setProfileData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || ''
            });
        }

        const fetchEmailSettings = async () => {
            try {
                const res = await api.get('/admin/settings/email');
                setEmailSettings({
                    SMTP_HOST: res.data.SMTP_HOST || '',
                    SMTP_PORT: res.data.SMTP_PORT || '',
                    SMTP_USER: res.data.SMTP_USER || '',
                    SMTP_PASS: res.data.SMTP_PASS || '',
                    SMTP_FROM: res.data.SMTP_FROM || '',
                    TEMPLATE_WELCOME_SUBJECT: res.data.TEMPLATE_WELCOME_SUBJECT || '',
                    TEMPLATE_WELCOME_BODY: res.data.TEMPLATE_WELCOME_BODY || '',
                    TEMPLATE_RESET_PASSWORD_SUBJECT: res.data.TEMPLATE_RESET_PASSWORD_SUBJECT || '',
                    TEMPLATE_RESET_PASSWORD_BODY: res.data.TEMPLATE_RESET_PASSWORD_BODY || '',
                    TEMPLATE_RESET_SUCCESS_SUBJECT: res.data.TEMPLATE_RESET_SUCCESS_SUBJECT || '',
                    TEMPLATE_RESET_SUCCESS_BODY: res.data.TEMPLATE_RESET_SUCCESS_BODY || '',
                    TEMPLATE_MONTHLY_REPORT_SUBJECT: res.data.TEMPLATE_MONTHLY_REPORT_SUBJECT || '',
                    TEMPLATE_MONTHLY_REPORT_BODY: res.data.TEMPLATE_MONTHLY_REPORT_BODY || ''
                });
            } catch (error) {
                console.error('Failed to fetch email settings');
            }
        };
        fetchEmailSettings();
    }, [user]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        try {
            await api.patch(`/users/profile/${user?.username}`, profileData);
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile' });
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        try {
            await api.put('/auth/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setMessage({ type: 'success', text: 'Password changed successfully' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
        }
    };

    const handleEmailSettingsUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        try {
            await api.post('/admin/settings/email', emailSettings);
            setMessage({ type: 'success', text: 'Email settings updated successfully' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update email settings' });
        }
    };

    if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
                    <p className="text-gray-500">Manage your account preferences and security.</p>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {message.text}
                    </div>
                )}

                {/* Profile Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Mail className="text-gray-400" size={20} />
                        Profile Details
                    </h2>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    type="text"
                                    value={profileData.firstName}
                                    onChange={e => setProfileData({ ...profileData, firstName: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    value={profileData.lastName}
                                    onChange={e => setProfileData({ ...profileData, lastName: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={profileData.email}
                                onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                            >
                                <Save size={18} />
                                Save Profile
                            </button>
                        </div>
                    </form>
                </div>

                {/* Password Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Lock className="text-gray-400" size={20} />
                        Change Password
                    </h2>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition flex items-center gap-2"
                            >
                                <Save size={18} />
                                Update Password
                            </button>
                        </div>
                    </form>
                </div>

                {/* Email (SMTP) Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Save className="text-gray-400" size={20} />
                        SMTP Configuration
                    </h2>
                    <form onSubmit={handleEmailSettingsUpdate} className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                                <input
                                    type="text"
                                    placeholder="smtp.gmail.com"
                                    value={emailSettings.SMTP_HOST}
                                    onChange={e => setEmailSettings({ ...emailSettings, SMTP_HOST: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                                <input
                                    type="text"
                                    placeholder="587"
                                    value={emailSettings.SMTP_PORT}
                                    onChange={e => setEmailSettings({ ...emailSettings, SMTP_PORT: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label>
                                <input
                                    type="text"
                                    placeholder="user@example.com"
                                    value={emailSettings.SMTP_USER}
                                    onChange={e => setEmailSettings({ ...emailSettings, SMTP_USER: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={emailSettings.SMTP_PASS}
                                    onChange={e => setEmailSettings({ ...emailSettings, SMTP_PASS: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From Email Address</label>
                            <input
                                type="email"
                                placeholder="noreply@cyclingapp.com"
                                value={emailSettings.SMTP_FROM}
                                onChange={e => setEmailSettings({ ...emailSettings, SMTP_FROM: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                            >
                                <Save size={18} />
                                Save SMTP Configuration
                            </button>
                        </div>
                    </form>
                </div>

                {/* Email Templates */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Mail className="text-gray-900" size={24} />
                        <h2 className="text-xl font-bold text-gray-900">Email Templates</h2>
                    </div>

                    {/* Welcome Email Template */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Welcome Email</h3>
                        <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded border italic">
                            Sent to new cyclists after they register. <br />
                            Available Placeholders: <strong>{`{{firstName}}`}</strong>
                        </p>
                        <form onSubmit={handleEmailSettingsUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                                <input
                                    type="text"
                                    value={emailSettings.TEMPLATE_WELCOME_SUBJECT}
                                    onChange={e => setEmailSettings({ ...emailSettings, TEMPLATE_WELCOME_SUBJECT: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Body (HTML supported)</label>
                                <textarea
                                    value={emailSettings.TEMPLATE_WELCOME_BODY}
                                    onChange={e => setEmailSettings({ ...emailSettings, TEMPLATE_WELCOME_BODY: e.target.value })}
                                    rows={8}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    Save Welcome Template
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Password Reset Email Template */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Password Reset Email</h3>
                        <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded border italic">
                            Sent to users who request a password reset. <br />
                            Available Placeholders: <strong>{`{{resetLink}}`}</strong>
                        </p>
                        <form onSubmit={handleEmailSettingsUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                                <input
                                    type="text"
                                    value={emailSettings.TEMPLATE_RESET_PASSWORD_SUBJECT}
                                    onChange={e => setEmailSettings({ ...emailSettings, TEMPLATE_RESET_PASSWORD_SUBJECT: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Body (HTML supported)</label>
                                <textarea
                                    value={emailSettings.TEMPLATE_RESET_PASSWORD_BODY}
                                    onChange={e => setEmailSettings({ ...emailSettings, TEMPLATE_RESET_PASSWORD_BODY: e.target.value })}
                                    rows={8}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    Save Reset Template
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Password Reset Success Template */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Password Reset Success</h3>
                        <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded border italic">
                            Sent after a user successfully changes their password. <br />
                            Available Placeholders: <strong>{`{{firstName}}`}</strong>
                        </p>
                        <form onSubmit={handleEmailSettingsUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                                <input
                                    type="text"
                                    value={emailSettings.TEMPLATE_RESET_SUCCESS_SUBJECT}
                                    onChange={e => setEmailSettings({ ...emailSettings, TEMPLATE_RESET_SUCCESS_SUBJECT: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Body (HTML supported)</label>
                                <textarea
                                    value={emailSettings.TEMPLATE_RESET_SUCCESS_BODY}
                                    onChange={e => setEmailSettings({ ...emailSettings, TEMPLATE_RESET_SUCCESS_BODY: e.target.value })}
                                    rows={8}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    Save Success Template
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Monthly Cyclist Report Template */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Cyclist Report</h3>
                        <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded border italic">
                            Monthly performance summary for cyclists. <br />
                            Available Placeholders: <strong>{`{{firstName}}, {{month}}, {{totalRides}}, {{totalDistance}}, {{elevationGain}}`}</strong>
                        </p>
                        <form onSubmit={handleEmailSettingsUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                                <input
                                    type="text"
                                    value={emailSettings.TEMPLATE_MONTHLY_REPORT_SUBJECT}
                                    onChange={e => setEmailSettings({ ...emailSettings, TEMPLATE_MONTHLY_REPORT_SUBJECT: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Body (HTML supported)</label>
                                <textarea
                                    value={emailSettings.TEMPLATE_MONTHLY_REPORT_BODY}
                                    onChange={e => setEmailSettings({ ...emailSettings, TEMPLATE_MONTHLY_REPORT_BODY: e.target.value })}
                                    rows={10}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    Save Report Template
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
