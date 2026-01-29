'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Chrome, Facebook, Apple, Zap } from 'lucide-react'; // Approximating Google with Chrome icon as Google isn't in default lucide set sometimes, or use plain text. Lucide has 'Chrome' which looks like a browser, maybe better to use text or generic icon if 'Google' specific isn't available. Lucide usually doesn't have brand icons. I will use text/custom SVG or just placeholder icons.

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/auth/login', { email, password });
            login(res.data.token, res.data.user);
        } catch (err: any) {
            console.error('Login error details:', err);
            const msg = err?.response?.data?.message || err.message || 'Login failed';
            const status = err?.response?.status;
            const details = status ? ` (Status: ${status})` : '';
            setError(msg + details);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1541625602330-2277a4c46182?q=80&w=1920&auto=format&fit=crop')",
                    filter: 'brightness(0.8)' // Slightly darken for better contrast if needed, though card is dark
                }}
            ></div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md bg-black/90 p-8 rounded-none shadow-2xl backdrop-blur-sm sm:rounded-lg border border-white/10">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="bg-orange-500 p-3 rounded-xl transform -skew-x-12">
                            <Zap className="text-white fill-white h-8 w-8" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">CycleTrack</h1>
                </div>
                <h2 className="text-xl font-bold text-center text-white mb-6">Log In</h2>

                {/* Social Login Buttons */}
                <div className="space-y-3 mb-6">
                    <button type="button" className="w-full bg-white text-gray-900 font-medium py-2.5 px-4 rounded flex items-center justify-center gap-3 hover:bg-gray-100 transition">
                        <span className="text-lg font-bold text-blue-500">G</span> Sign In With Google
                    </button>
                    <button type="button" className="w-full bg-white text-gray-900 font-medium py-2.5 px-4 rounded flex items-center justify-center gap-3 hover:bg-gray-100 transition">
                        <Apple size={20} /> Sign In With Apple
                    </button>
                    <button type="button" className="w-full bg-white text-gray-900 font-medium py-2.5 px-4 rounded flex items-center justify-center gap-3 hover:bg-gray-100 transition">
                        <Facebook size={20} className="text-blue-600" /> Sign In With Facebook
                    </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-gray-600 flex-1"></div>
                    <span className="text-gray-400 text-sm">or</span>
                    <div className="h-px bg-gray-600 flex-1"></div>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="text-red-500 text-sm text-center bg-red-900/20 py-2 rounded border border-red-900/50">{error}</div>}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">Email or Username</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-white text-gray-900 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Email or Username"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-white text-gray-900 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Your Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>



                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded" />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                                Remember me
                            </label>
                        </div>
                        <div className="text-sm">
                            <Link href="/auth/forgot-password" className="font-medium text-orange-500 hover:text-orange-400">
                                Forgot your password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded text-white bg-orange-700 hover:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition shadow-lg shadow-orange-900/20"
                    >
                        Log In
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/register" className="text-sm font-medium text-white hover:text-orange-400 hover:underline transition">
                        Create a New Account
                    </Link>
                </div>

                <p className="mt-8 text-center text-xs text-gray-500">
                    By continuing, you are agreeing to our <a href="#" className="underline hover:text-gray-400">Terms of Service</a> and <a href="#" className="underline hover:text-gray-400">Privacy Policy</a>.
                </p>
            </div >
        </div >
    );
}
