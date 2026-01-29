'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    image?: string;
    role?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User, redirectPath?: string) => void;
    logout: () => void;
    updateUser: (updatedData: Partial<User>) => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(Cookies.get('token') || null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const currentToken = Cookies.get('token');
            // console.log('AuthContext: Checking token...', currentToken); 
            if (currentToken) {
                setToken(currentToken);
                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                } catch (error: any) {
                    console.error('Failed to fetch user', error);
                    // If token is invalid or user deleted (404), logout
                    Cookies.remove('token');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = (newToken: string, userData: User, redirectPath: string = '/dashboard') => {
        Cookies.set('token', newToken, { expires: 7 });
        setToken(newToken);
        setUser(userData);
        router.push(redirectPath);
    };

    const logout = () => {
        Cookies.remove('token');
        setToken(null);
        setUser(null);
        router.push('/login');
    };

    const updateUser = (updatedData: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...updatedData } : null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
