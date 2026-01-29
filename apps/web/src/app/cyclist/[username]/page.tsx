'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import ReportModal from '@/components/modals/ReportModal';
import { PencilIcon, X, Camera, BadgeCheck, Flag } from 'lucide-react';

// ... (in component)
// The state declaration for showReportModal is already present in the ProfilePage component.

// ... (in actions area)
// The button for reporting is already present in the JSX.

// ... (at end)
// The ReportModal rendering is moved to be inside DashboardLayout and after FollowListModal.
import Link from 'next/link';
import FollowListModal from '@/components/modals/FollowListModal';
import ActivityCard from '@/components/ActivityCard';
import ComparisonTable from '@/components/ComparisonTable';
import { Country, State } from 'country-state-city';
import { Facebook, Instagram, BarChart2 } from 'lucide-react';
import { generateCyclistSchema } from '@/lib/seo';
import Script from 'next/script';

const EditProfileModal = ({ profile, onClose, onUpdate }: any) => {
    const [formData, setFormData] = useState({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '', // Add email
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || '',
        gender: profile.gender || '',
        bikeModel: profile.bikeModel || '',
        bio: profile.bio || '',
        isPublic: profile.isPublic ?? true,
        facebook: profile.facebook || '',
        instagram: profile.instagram || '',
    });
    const [loading, setLoading] = useState(false);

    const allCountries = Country.getAllCountries();
    const selectedCountry = allCountries.find(c => c.name === formData.country);
    const availableStates = selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : [];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (name === 'country') {
            setFormData({
                ...formData,
                country: value,
                state: '' // Reset state when country changes
            });
        } else {
            setFormData({
                ...formData,
                [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put('/users/profile', formData);
            onUpdate(res.data);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Edit Profile</h3>
                    <button onClick={onClose}><X className="h-6 w-6 text-gray-400 hover:text-gray-600" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address (Private)</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        />
                        <p className="text-xs text-gray-500 mt-1">Used for login and notifications.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Country</label>
                        <select name="country" value={formData.country} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 bg-white">
                            <option value="">Select Country</option>
                            {allCountries.map((c: any) => (
                                <option key={c.isoCode} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {availableStates.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">State / Region</label>
                            <select name="state" value={formData.state} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 bg-white">
                                <option value="">Select State</option>
                                {availableStates.map((s: any) => (
                                    <option key={s.isoCode} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">City</label>
                            <input name="city" value={formData.city} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 bg-white">
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Bike Model</label>
                        <input name="bikeModel" value={formData.bikeModel} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Bio</label>
                        <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Facebook URL</label>
                            <input name="facebook" value={formData.facebook} onChange={handleChange} placeholder="https://facebook.com/..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Instagram URL</label>
                            <input name="instagram" value={formData.instagram} onChange={handleChange} placeholder="https://instagram.com/..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="isPublic"
                            id="isPublic"
                            checked={formData.isPublic}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isPublic" className="block text-sm font-medium text-gray-700">Public Profile (Visible on search & Google)</label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function ProfilePage() {
    const params = useParams();
    const { user, updateUser } = useAuth();
    const username = params.username;
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showFollowModal, setShowFollowModal] = useState(false);
    const [followModalTitle, setFollowModalTitle] = useState('');
    const [followModalUsers, setFollowModalUsers] = useState<any[]>([]);
    const [showReportModal, setShowReportModal] = useState(false);

    // Comparison State
    const [isComparing, setIsComparing] = useState(false);
    const [comparisonStats, setComparisonStats] = useState<any>(null);
    const [userComparisonStats, setUserComparisonStats] = useState<any>(null);
    const [compareLoading, setCompareLoading] = useState(false);

    const isOwner = user?.username === username;

    const handleCompare = async () => {
        if (isComparing) {
            setIsComparing(false);
            return;
        }

        if (comparisonStats && userComparisonStats) {
            setIsComparing(true);
            return;
        }

        setCompareLoading(true);
        try {
            if (!user) return;
            const [oppRes, userRes] = await Promise.all([
                api.get(`/users/${username}/stats`),
                api.get(`/users/${user.username}/stats`)
            ]);
            setComparisonStats(oppRes.data);
            setUserComparisonStats(userRes.data);
            setIsComparing(true);
        } catch (error) {
            console.error('Failed to fetch comparison stats', error);
            alert('Failed to load comparison data');
        } finally {
            setCompareLoading(false);
        }
    };

    const openFollowList = async (type: 'followers' | 'following') => {
        if (!username) return;
        setFollowModalTitle(type === 'followers' ? 'Followers' : 'Following');
        setShowFollowModal(true);
        setFollowModalUsers([]);

        try {
            const res = await api.get(`/users/${username}/${type}`);
            setFollowModalUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch follow list', error);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('/users/profile/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Update local profile state
            setProfile({ ...profile, image: res.data.image });
            // Update global auth context so all components reflect the change
            if (user?.id === profile.id) {
                updateUser({ image: res.data.image });
            }
        } catch (error) {
            console.error('Failed to upload profile photo', error);
            alert('Failed to upload profile photo');
        }
    };

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setError(null);
            try {
                const res = await api.get(`/users/${username}`);
                setProfile(res.data);
            } catch (error: any) {
                if (error.response && error.response.status === 404) {
                    setProfile(null); // User not found, handled by UI
                } else {
                    console.error(error);
                    setError('Failed to load profile. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };
        if (username) fetchProfile();
    }, [username]);

    const [followLoading, setFollowLoading] = useState(false);

    const handleFollowToggle = async () => {
        if (!profile) return;
        setFollowLoading(true);
        try {
            if (profile.isFollowing) {
                await api.post('/users/unfollow', { followingId: profile.id });
                setProfile((prev: any) => ({
                    ...prev,
                    isFollowing: false,
                    _count: {
                        ...prev._count,
                        followers: prev._count.followers - 1
                    }
                }));
            } else {
                await api.post('/users/follow', { followingId: profile.id });
                setProfile((prev: any) => ({
                    ...prev,
                    isFollowing: true,
                    _count: {
                        ...prev._count,
                        followers: prev._count.followers + 1
                    }
                }));
            }
        } catch (error) {
            console.error('Failed to toggle follow status', error);
            alert('Failed to update follow status');
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!profile) return <div>User not found</div>;

    // Generate JSON-LD structured data
    const jsonLd = generateCyclistSchema(profile);

    return (
        <DashboardLayout>
            {/* JSON-LD Structured Data */}
            <Script
                id="cyclist-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="bg-white rounded-none md:rounded-xl shadow-sm border-b md:border border-gray-100 overflow-hidden">
                <div className="h-24 md:h-32 bg-indigo-600"></div>
                <div className="px-4 md:px-8 pb-8">
                    <div className="flex flex-col items-center w-full mt-4 md:mt-2">
                        <div className="bg-white p-1 rounded-full relative group shrink-0 -mt-10 md:-mt-12">
                            <div className="h-24 w-24 md:h-32 md:w-32 bg-gray-200 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold text-gray-500 overflow-hidden relative border-4 border-white shadow-sm">
                                {profile.image ? (
                                    <img
                                        src={profile.image.startsWith('http') ? profile.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${profile.image}`}
                                        alt={`${profile.firstName} ${profile.lastName}'s Profile Picture`}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (profile.username?.[0]?.toUpperCase() || '?')}

                                {isOwner && (
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Camera className="text-white h-8 w-8" />
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-3 mt-4 w-full">
                            {isOwner ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all"
                                >
                                    <PencilIcon size={16} /> Edit Profile
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleFollowToggle}
                                        disabled={followLoading}
                                        className={`px-8 py-1.5 rounded-lg text-sm font-semibold transition-colors ${profile.isFollowing
                                            ? 'bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {profile.isFollowing ? 'Unfollow' : 'Follow'}
                                    </button>
                                    {!isOwner && user && (
                                        <>
                                            <button
                                                onClick={handleCompare}
                                                disabled={compareLoading}
                                                className={`px-4 py-1.5 border border-indigo-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isComparing ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                                            >
                                                <BarChart2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {isComparing && comparisonStats && userComparisonStats ? (
                        <div className="mt-4">
                            <ComparisonTable
                                userStats={userComparisonStats}
                                opponentStats={comparisonStats}
                                userProfile={user}
                                opponentProfile={profile}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col items-center text-center mt-6">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-1 uppercase tracking-tight">
                                        {profile.firstName} {profile.lastName}
                                        {profile.isVerified && <BadgeCheck className="w-5 h-5 text-white fill-blue-600" />}
                                    </h1>
                                </div>
                                <p className="text-gray-500 font-medium">@{profile.username}</p>

                                <div className="flex flex-wrap justify-center gap-4 mt-3 text-sm font-medium text-gray-600">
                                    <div className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => openFollowList('followers')}>
                                        <b>{profile._count?.followers || 0}</b> Followers
                                    </div>
                                    <div className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => openFollowList('following')}>
                                        <b>{profile._count?.following || 0}</b> Following
                                    </div>
                                    <div>
                                        <b>{profile._count?.activities || 0}</b> Activities
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-col gap-2 text-sm text-gray-600 w-full max-w-sm items-center">
                                    <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1">
                                        {profile.city && (
                                            <span className="flex items-center gap-1.5">
                                                <span className="text-pink-500">📍</span>
                                                {profile.city}{profile.state && `, ${profile.state}`}, {profile.country}
                                            </span>
                                        )}

                                        {(profile.facebook || profile.instagram) && (
                                            <div className="flex items-center gap-3">
                                                {profile.facebook && (
                                                    <a href={profile.facebook.startsWith('http') ? profile.facebook : `https://${profile.facebook}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                                                        <Facebook size={18} />
                                                    </a>
                                                )}
                                                {profile.instagram && (
                                                    <a href={profile.instagram.startsWith('http') ? profile.instagram : `https://${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors">
                                                        <Instagram size={18} />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {profile.bikeModel && (
                                        <span className="flex items-center justify-center gap-2">
                                            <span>🚲</span>
                                            {profile.bikeModel}
                                        </span>
                                    )}
                                </div>

                                {profile.bio && (
                                    <p className="mt-4 text-sm text-gray-700 max-w-md leading-relaxed">
                                        {profile.bio.split(' ').map((word: string, i: number) => (
                                            word.startsWith('#') ? (
                                                <span key={i} className="text-indigo-600 mr-1">{word}</span>
                                            ) : (
                                                <span key={i} className="mr-1">{word}</span>
                                            )
                                        ))}
                                    </p>
                                )}
                            </div>

                            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center md:items-start">
                                    <div className="text-[10px] md:text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Distance</div>
                                    <div className="text-xl md:text-2xl font-black text-gray-900 leading-none">{Number(profile.totalDistance).toFixed(0)} <span className="text-xs md:text-sm font-medium text-gray-400">km</span></div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center md:items-start">
                                    <div className="text-[10px] md:text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Longest</div>
                                    <div className="text-xl md:text-2xl font-black text-gray-900 leading-none">{Number(profile.longestRideDistance).toFixed(0)} <span className="text-xs md:text-sm font-medium text-gray-400">km</span></div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center md:items-start">
                                    <div className="text-[10px] md:text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Elev Gain</div>
                                    <div className="text-xl md:text-2xl font-black text-gray-900 leading-none">{Number(profile.totalElevationGain || 0).toFixed(0)} <span className="text-xs md:text-sm font-medium text-gray-400">m</span></div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center md:items-start">
                                    <div className="text-[10px] md:text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Time</div>
                                    <div className="text-xl md:text-2xl font-black text-gray-900 leading-none">
                                        {Math.floor((profile.totalDuration || 0) / 3600)}<span className="text-xs md:text-sm font-medium text-gray-400">h</span> {Math.round(((profile.totalDuration || 0) % 3600) / 60)}<span className="text-xs md:text-sm font-medium text-gray-400">m</span>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center md:items-start">
                                    <div className="text-[10px] md:text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Rides</div>
                                    <div className="text-xl md:text-2xl font-black text-gray-900 leading-none">{profile._count?.activities || 0}</div>
                                </div>
                            </div>

                            {/* Milestones Section */}
                            {profile.milestones && Object.values(profile.milestones).some((m: any) => Array.isArray(m) && m.length > 0) && (
                                <div className="mt-8">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">Milestones</h2>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        {Object.entries(profile.milestones)
                                            .filter(([_, activities]: [string, any]) => Array.isArray(activities) && activities.length > 0)
                                            .map(([key, activities]: [string, any]) => {
                                                const count = activities.length;
                                                return (
                                                    <div key={key} className="p-4 rounded-xl border bg-amber-50/50 border-amber-100 flex flex-col items-center transition-all hover:bg-amber-50">
                                                        <div className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1">{key}</div>
                                                        <div className="text-xl font-black text-gray-900">x {count}</div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            {/* Recent Activities */}
                            {(profile.isPublic || isOwner) && profile.recentActivities?.length > 0 && (
                                <div className="mt-8">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Rides</h2>
                                    <div className="space-y-6">
                                        {profile.recentActivities.map((activity: any) => (
                                            <ActivityCard
                                                key={activity.id}
                                                activity={{
                                                    ...activity,
                                                    user: profile // Ensure user data is available for the card
                                                }}
                                                currentUser={user}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}




                            <div className="mt-8">
                                <Link href="/dashboard" className="text-indigo-600 hover:underline text-sm font-medium">View detailed stats and milestones on Dashboard &rarr;</Link>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {
                isEditing && (
                    <EditProfileModal
                        profile={profile}
                        onClose={() => setIsEditing(false)}
                        onUpdate={(updatedData: any) => setProfile(updatedData)}
                    />
                )
            }

            {
                showFollowModal && (
                    <FollowListModal
                        title={followModalTitle}
                        users={followModalUsers}
                        onClose={() => setShowFollowModal(false)}
                    />
                )
            }

            {
                showReportModal && (
                    <ReportModal
                        isOpen={showReportModal}
                        onClose={() => setShowReportModal(false)}
                        entityId={profile.id}
                        entityType="user"
                    />
                )
            }
        </DashboardLayout >
    );
}
