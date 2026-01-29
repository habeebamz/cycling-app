
'use client';

import React, { useState, Suspense } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage("Passwords don't match");
            setStatus('error');
            return;
        }

        if (password.length < 6) {
            setMessage("Password must be at least 6 characters");
            setStatus('error');
            return;
        }

        setStatus('loading');
        try {
            await api.post('/auth/reset-password', { token, newPassword: password });
            setMessage('Password reset successfully! You can now login with your new password.');
            setStatus('success');
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (error: any) {
            setMessage(error.response?.data?.message || 'Failed to reset password. Link may be expired.');
            setStatus('error');
        }
    };

    if (!token) {
        return (
            <div className="text-center">
                <div className="text-red-500 mb-4">Invalid Link</div>
                <p className="text-gray-600 mb-6">This password reset link is invalid or missing a token.</p>
                <Link href="/auth/forgot-password" className="text-indigo-600 hover:underline">Request a new link</Link>
            </div>
        );
    }

    return (
        <div>
            {status === 'success' ? (
                <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                        <CheckCircle size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h2>
                    <p className="text-gray-600 mb-6">Redirecting to login in a moment...</p>
                    <Link href="/login" className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                        Login Now
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {status === 'error' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                            {message}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'loading' ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            )}
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
                    <p className="text-gray-500 mt-2">Enter a new secure password for your account.</p>
                </div>
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
