'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        try {
            const res = await api.post('/auth/forgot-password', { email });
            setMessage(res.data.message);
            setStatus('success');
        } catch (error: any) {
            setMessage(error.response?.data?.message || 'Something went wrong.');
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="mb-6">
                    <Link href="/login" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm mb-4">
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
                    <p className="text-gray-500 mt-2">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                {status === 'success' ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                        {message}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {status === 'error' && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                                {message}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'loading' ? 'Sending Link...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
