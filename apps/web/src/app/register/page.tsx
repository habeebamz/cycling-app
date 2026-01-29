'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Chrome, Facebook, Apple, Zap } from 'lucide-react';

export default function RegisterPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/auth/register', {
                email,
                password,
                username,
                firstName,
                lastName
            });
            // Auto login or redirect to login? Usually auto login.
            // Backend register might return user/token or just success.
            // Assuming it returns same as login for now, or we redirect.
            // Let's assume it returns { token, user } or we just redirect to login.
            if (res.data.token) {
                login(res.data.token, res.data.user);
            } else {
                router.push('/login');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden py-12">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1541625602330-2277a4c46182?q=80&w=1920&auto=format&fit=crop')",
                    filter: 'brightness(0.8)'
                }}
            ></div>

            {/* Register Card */}
            <div className="relative z-10 w-full max-w-md bg-black/90 p-8 rounded-none shadow-2xl backdrop-blur-sm sm:rounded-lg border border-white/10">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="bg-orange-500 p-3 rounded-xl transform -skew-x-12">
                            <Zap className="text-white fill-white h-8 w-8" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">CycleTrack</h1>
                </div>
                <h2 className="text-xl font-bold text-center text-white mb-6">Create Account</h2>

                {/* Social Login Buttons */}
                <div className="space-y-3 mb-6">
                    <button type="button" className="w-full bg-white text-gray-900 font-medium py-2 px-4 rounded flex items-center justify-center gap-3 hover:bg-gray-100 transition">
                        <span className="text-lg font-bold text-blue-500">G</span> Sign Up With Google
                    </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-gray-600 flex-1"></div>
                    <span className="text-gray-400 text-sm">or</span>
                    <div className="h-px bg-gray-600 flex-1"></div>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && <div className="text-red-500 text-sm text-center bg-red-900/20 py-2 rounded border border-red-900/50">{error}</div>}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">First Name</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-white text-gray-900 px-3 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">Last Name</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-white text-gray-900 px-3 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Username</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-white text-gray-900 px-3 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-white text-gray-900 px-3 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-white text-gray-900 px-3 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Create Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded text-white bg-orange-700 hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition shadow-lg shadow-orange-900/20 mt-6"
                    >
                        Create Account
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium text-white hover:text-orange-400 hover:underline transition">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
