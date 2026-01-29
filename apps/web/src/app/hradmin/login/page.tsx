
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Shield, Lock } from 'lucide-react';

export default function AdminLoginPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/auth/login', { email: identifier, password, isAdminLogin: true });

            console.log('Admin Login Response:', res.data);
            if (!['ADMIN', 'MANAGER', 'EDITOR'].includes(res.data.user.role)) {
                console.error('Login block: User role is not ADMIN/MANAGER/EDITOR', res.data.user);
                setError('Access Denied: You do not have admin privileges.');
                return;
            }

            // Custom login handling for admin to avoid default redirect
            // We can reuse login() but then we need to handle redirect manually if login() redirects
            // AuthContext login() usually redirects. We might need to modify AuthContext or handle it here.
            // Let's modify AuthContext login to accept an optional redirect path? 
            // Or just manually set cookie and state here if we want to bypass AuthContext redirect?
            // Better to use login() and let it redirect, but we need to ensure AuthContext redirects Admins to /hradmin 
            // OR we revert AuthContext and handle redirect here.
            // User requested "Change hradmin login from /login", implying separation.
            // So if I revert AuthContext redirect, then login() sends to /dashboard.
            // I should probably manually set cookie/user here to control redirect.

            // Actually, let's update AuthContext to NOT redirect if we pass a flag? 
            // No, easier to just manually implement 'login' logic here since it's just cookie + state.
            // But AuthContext `login` does `setUser`. We need access to `setUser`.
            // `login` function in AuthContext pushes to route.

            // Let's rely on the AuthContext `login` but pass a redirectArg? 
            // AuthContext doesn't support that yet.

            // Plan: Revert AuthContext to default /dashboard. 
            // Then here, call `login` (which goes to dashboard), then immediately `router.push('/hradmin')`?
            // Race condition.

            // Better: Add `redirectUrl` optional param to `login` in AuthContext.

            login(res.data.token, res.data.user, '/hradmin');

        } catch (err: any) {
            setError(err?.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-red-100 p-3 rounded-full mb-4">
                        <Shield className="h-8 w-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
                    <p className="text-gray-500">Secure Access Only</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                                placeholder="Admin ID"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                            />
                            <div className="absolute left-3 top-2.5 text-gray-400">
                                <Shield size={18} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type="password"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <div className="absolute left-3 top-2.5 text-gray-400">
                                <Lock size={18} />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-red-600 text-white font-bold py-2.5 rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-900/20"
                    >
                        Access Dashboard
                    </button>

                    <div className="text-center">
                        <a href="/login" className="text-sm text-gray-500 hover:text-gray-900">Return to User Login</a>
                    </div>
                </form>
            </div>
        </div>
    );
}
