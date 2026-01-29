'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { useParams, useSearchParams } from 'next/navigation';
import { Calendar, MapPin, Users, Trophy, Bell, BellOff, MessageSquare, Send, Trash2, Flag } from 'lucide-react';
import ReportModal from '@/components/modals/ReportModal';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import GroupPostCard from '@/components/GroupPostCard';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';
import InviteModal from '@/components/modals/InviteModal';

export default function GroupDetailsPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const targetPostId = searchParams.get('post') || (params.postId as string);
    const { user } = useAuth(); // Need current user to check join status from list or id
    const [group, setGroup] = useState<any>(null);
    const [challenges, setChallenges] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('feed');
    const [loading, setLoading] = useState(true);

    const [isJoined, setIsJoined] = useState(false);
    const [userRole, setUserRole] = useState<string>('MEMBER'); // ADMIN or MEMBER
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [newPostContent, setNewPostContent] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editImage, setEditImage] = useState('');
    const [editProfileImage, setEditProfileImage] = useState('');
    const [editIsPrivate, setEditIsPrivate] = useState(false);

    const [showChallengeModal, setShowChallengeModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [challengeForm, setChallengeForm] = useState({
        title: '', description: '', type: 'DISTANCE', goal: '', condition: 'ACCUMULATIVE',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        trophyImage: ''
    });
    const [appealMessage, setAppealMessage] = useState('');
    const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                const res = await api.get(`/groups/${id}`);
                const found = res.data;
                setGroup(found);

                if (found) {
                    setEditName(found.name);
                    setEditDesc(found.description || '');
                    setEditImage(found.image || '');
                    setEditProfileImage(found.profileImage || '');
                    setEditIsPrivate(found.isPrivate || false);

                    // Check current user role - endpoint needed or filter from members
                    // Let's rely on valid fetch if we can, or just check if we can update?
                    // Ideally we fetch /groups/:id which returns { group, userRole }
                    // For now let's hack it: try to update, if 403 then hide? No, bad UX.
                    // Let's fetch members to find self.
                    // Assuming we have an endpoint or we can deduce.
                    // Let's add a quick check endpoint or just fetch user profile and match id?
                    // Simpler: Just render the button, on click if fails allow handling.
                    // Better: Fetch my membership.
                    // Since we don't have a direct "get my membership" let's iterate members if possible?
                    // Group object from list usually doesn't have all members.
                    // Implementation Plan: Add "Settings" tab that tries to load sensitive settings.
                }

                if (found) {
                    const chRes = await api.get(`/challenges/group/${id}`);
                    setChallenges(chRes.data);
                }

                // Check membership
                try {
                    const myGroupsRes = await api.get('/users/me/groups'); // We added notificationsEnabled to this
                    const myMembership = myGroupsRes.data.find((g: any) => g.id === id);
                    if (myMembership) {
                        setIsJoined(true);
                        setUserRole(myMembership.role || 'MEMBER');
                        setNotificationsEnabled(myMembership.notificationsEnabled);
                    } else {
                        setIsJoined(false);
                    }
                } catch (e) { console.error('Failed to check membership', e); }

                fetchPosts();
                fetchMembers();

            } catch (error) {
                console.error('Failed to fetch group details', error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchGroup();
    }, [id]);

    useEffect(() => {
        if (targetPostId && posts.length > 0 && !loading) {
            // Small delay to ensure GroupPostCard elements are fully rendered/mounted
            const timer = setTimeout(() => {
                const element = document.getElementById(`post-${targetPostId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [targetPostId, posts, loading]);

    const fetchPosts = async () => {
        try {
            const res = await api.get(`/groups/${id}/posts`);
            let fetchedPosts = res.data;

            // If we have a target post, move it to the top
            if (targetPostId) {
                const targetIdx = fetchedPosts.findIndex((p: any) => p.id === targetPostId);
                if (targetIdx > -1) {
                    const [targetPost] = fetchedPosts.splice(targetIdx, 1);
                    fetchedPosts = [targetPost, ...fetchedPosts];
                }
            }

            setPosts(fetchedPosts);
        } catch (e) {
            // If 403 (private), posts will be empty or error handled
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await api.get(`/groups/${id}/members`);
            setMembers(res.data);
        } catch (e) {
            console.error('Failed to fetch members', e);
        }
    };

    const handleSaveGroup = async () => {
        try {
            await api.put(`/groups/${id}`, {
                name: editName,
                description: editDesc,
                image: editImage,
                profileImage: editProfileImage,
                isPrivate: editIsPrivate
            });
            setGroup({ ...group, name: editName, description: editDesc, image: editImage, profileImage: editProfileImage, isPrivate: editIsPrivate });
            setIsEditing(false);
            alert('Group updated successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to update group. You might not have permissions.');
        }
    };

    const handleCreateChallenge = () => {
        setShowChallengeModal(true);
    };

    const handleSubmitChallenge = async () => {
        if (!challengeForm.title || !challengeForm.goal) return alert('Title and Goal required');

        try {
            const res = await api.post('/challenges', {
                ...challengeForm,
                groupId: id, // Add the group ID from the page params
                // Ensure dates are ISO
                startDate: new Date(challengeForm.startDate).toISOString(),
                endDate: new Date(challengeForm.endDate).toISOString(),
            });
            setChallenges([...challenges, res.data]);
            setShowChallengeModal(false);
            setChallengeForm({
                title: '', description: '', type: 'DISTANCE', goal: '', condition: 'ACCUMULATIVE',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                trophyImage: ''
            });
            alert('Challenge created!');
        } catch (error) {
            console.error(error);
            alert('Failed to create challenge');
        }
    };

    const handleJoinChallenge = async (challengeId: string) => {
        try {
            await api.post(`/challenges/${challengeId}/join`);
            alert('Joined challenge!');
            const chRes = await api.get(`/challenges/group/${id}`);
            setChallenges(chRes.data);
        } catch (error) {
            console.error(error);
            alert('Failed to join or already joined');
        }
    };

    const handleJoinGroup = async () => {
        try {
            await api.post('/groups/join', { groupId: id });
            setIsJoined(true);
            setNotificationsEnabled(true);
            alert('Joined group!');
            fetchPosts();
        } catch (error) {
            console.error(error);
            alert('Failed to join group');
        }
    };

    const handleDeleteGroup = async () => {
        if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
        try {
            await api.delete(`/groups/${id}`);
            alert('Group deleted successfully');
            // Redirect to groups list
            window.location.href = group.type === 'CLUB' ? '/clubs' : '/groups';
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to delete group');
        }
    };

    const handleLeaveGroup = async () => {
        if (!confirm('Are you sure you want to leave this group?')) return;
        try {
            await api.post('/groups/leave', { groupId: id });
            setIsJoined(false);
            alert('Left group');
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to leave group');
        }
    };

    const handleToggleNotifications = async () => {
        try {
            const res = await api.post('/groups/notifications', { groupId: id });
            setNotificationsEnabled(res.data.enabled);
        } catch (error) {
            console.error(error);
            alert('Failed to toggle notifications');
        }
    };

    const handleLiftBan = async (memberUserId: string) => {
        if (!confirm('Are you sure you want to lift this user\'s ban?')) return;
        try {
            await api.post(`/groups/${id}/lift-ban`, { targetUserId: memberUserId });
            alert('Ban lifted successfully!');
            fetchMembers(); // Refresh the list
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to lift ban');
        }
    };

    const handlePost = async () => {
        if (!newPostContent.trim()) return;
        try {
            await api.post('/groups/posts', { groupId: id, content: newPostContent });
            setNewPostContent('');
            fetchPosts();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to post');
        }
    };

    const handleSubmitAppeal = async () => {
        if (!appealMessage.trim()) return;
        setIsSubmittingAppeal(true);
        try {
            await api.post(`/groups/${id}/appeal`, { message: appealMessage });
            setGroup({ ...group, banAppealStatus: 'PENDING', banAppealMessage: appealMessage });
            alert('Appeal submitted successfully!');
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to submit appeal');
        } finally {
            setIsSubmittingAppeal(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!group) return <div>Group not found</div>;

    return (
        <DashboardLayout>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="h-32 md:h-48 bg-gray-200 relative">
                    {group.image ? (
                        <img src={group.image} alt="Group Cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white text-opacity-20 text-2xl md:text-4xl font-bold">
                            {group.name}
                        </div>
                    )}
                    {group.isPrivate && (
                        <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-black/50 text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs backdrop-blur-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-400 rounded-full"></span> Private
                        </div>
                    )}
                    {group.status === 'SUSPENDED' && (
                        <div className="absolute inset-x-0 bottom-0 bg-red-600/90 text-white py-1.5 md:py-2 text-center font-bold text-xs md:text-sm px-4">
                            ⚠️ This group has been suspended.
                        </div>
                    )}
                    {group.isSuspended && (
                        <div className="absolute inset-x-0 bottom-0 bg-orange-600/90 text-white py-1.5 md:py-2 text-center font-bold text-xs md:text-sm px-4">
                            ⚠️ Suspended until {new Date(group.banExpiresAt).toLocaleDateString()}.
                        </div>
                    )}
                </div>
                <div className="px-4 md:px-8 pb-8">
                    <div className="relative flex flex-col md:flex-row justify-between items-center md:items-end -mt-10 md:-mt-12 mb-6 gap-4">
                        <div className="bg-white p-1 rounded-xl shadow-sm">
                            <div className="h-20 w-20 md:h-24 md:w-24 bg-gray-100 rounded-lg flex items-center justify-center text-2xl md:text-3xl overflow-hidden">
                                {group.profileImage ? (
                                    <img
                                        src={group.profileImage.startsWith('http') ? group.profileImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${group.profileImage}`}
                                        alt={`${group.name} Logo`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    group.type === 'CLUB' ? '🛡️' : '👥'
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-end items-center gap-2 md:gap-3 w-full md:w-auto">
                            {isJoined ? (
                                <div className="flex items-center gap-2">
                                    {group.status !== 'SUSPENDED' && !group.isSuspended && (
                                        <button
                                            className="bg-white text-indigo-600 px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-50 border border-indigo-100 shadow-sm flex items-center gap-1.5"
                                            onClick={() => setShowInviteModal(true)}
                                        >
                                            <Users size={16} />
                                            Invite
                                        </button>
                                    )}
                                    <button
                                        onClick={handleToggleNotifications}
                                        disabled={group.isSuspended}
                                        className={`p-2 rounded-md ${notificationsEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'} ${group.isSuspended ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="Toggle Notifications"
                                    >
                                        {notificationsEnabled ? <Bell size={20} fill="currentColor" /> : <BellOff size={20} />}
                                    </button>

                                    {(userRole === 'OWNER' || user?.role === 'ADMIN') && (
                                        <button
                                            onClick={handleDeleteGroup}
                                            className="p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                                            title="Delete Group"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}

                                    {userRole !== 'OWNER' && (
                                        <button
                                            onClick={handleLeaveGroup}
                                            disabled={group.isSuspended}
                                            className={`bg-red-50 text-red-600 px-4 py-2 rounded-md font-medium text-sm border border-red-100 ${group.isSuspended ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100'}`}
                                        >
                                            Leave Group
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={handleJoinGroup}
                                    disabled={group.status === 'SUSPENDED' || group.isSuspended}
                                    className={`px-4 py-2 rounded-md font-medium text-sm border ${(group.status === 'SUSPENDED' || group.isSuspended)
                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        }`}
                                >
                                    {group.status === 'SUSPENDED' ? 'Suspended' : group.isSuspended ? 'Banned' : 'Join Group'}
                                </button>
                            )}
                            <button
                                onClick={() => setShowReportModal(true)}
                                className="p-2 border border-gray-300 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Report Group"
                            >
                                <Flag size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Challenge Creation Modal */}
                    {showChallengeModal && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                                <h2 className="text-xl font-bold mb-4">Create New Challenge</h2>
                                <div className="space-y-4">
                                    <input placeholder="Challenge Title" className="w-full border p-2 rounded" value={challengeForm.title} onChange={e => setChallengeForm({ ...challengeForm, title: e.target.value })} />
                                    <textarea placeholder="Description" className="w-full border p-2 rounded" value={challengeForm.description} onChange={e => setChallengeForm({ ...challengeForm, description: e.target.value })} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500">Type</label>
                                            <select className="w-full border p-2 rounded" value={challengeForm.type} onChange={e => setChallengeForm({ ...challengeForm, type: e.target.value })}>
                                                <option value="DISTANCE">Distance (km)</option>
                                                <option value="TIME">Time (seconds)</option>
                                                <option value="RIDES">Ride Count</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Goal</label>
                                            <input type="number" className="w-full border p-2 rounded" value={challengeForm.goal} onChange={e => setChallengeForm({ ...challengeForm, goal: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Condition</label>
                                        <select className="w-full border p-2 rounded" value={challengeForm.condition} onChange={e => setChallengeForm({ ...challengeForm, condition: e.target.value })}>
                                            <option value="ACCUMULATIVE">Accumulative (Total over period)</option>
                                            <option value="SINGLE">Single Ride (Must achieve in one go)</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500">Start Date</label>
                                            <input type="date" className="w-full border p-2 rounded" value={challengeForm.startDate} onChange={e => setChallengeForm({ ...challengeForm, startDate: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">End Date</label>
                                            <input type="date" className="w-full border p-2 rounded" value={challengeForm.endDate} onChange={e => setChallengeForm({ ...challengeForm, endDate: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Trophy Image URL (Optional)</label>
                                        <input placeholder="http://..." className="w-full border p-2 rounded" value={challengeForm.trophyImage} onChange={e => setChallengeForm({ ...challengeForm, trophyImage: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button onClick={() => setShowChallengeModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                    <button onClick={handleSubmitChallenge} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Create</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        {isEditing ? (
                            <div className="mb-4 space-y-3 max-w-lg bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-700">Edit Details</h3>
                                <input
                                    className="w-full text-lg font-bold text-gray-900 border border-gray-300 rounded-md px-3 py-2"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Group Name"
                                />
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                                    <textarea
                                        className="w-full text-gray-600 border border-gray-300 rounded-md p-2 focus:outline-none focus:border-indigo-600"
                                        value={editDesc}
                                        onChange={(e) => setEditDesc(e.target.value)}
                                        placeholder="Description"
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Cover Image URL</label>
                                    <input
                                        className="w-full border border-gray-300 rounded-md p-2"
                                        value={editImage}
                                        onChange={(e) => setEditImage(e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Profile Picture URL</label>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            className="w-full border border-gray-300 rounded-md p-2"
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
                                        className="h-4 w-4 text-indigo-600 rounded"
                                    />
                                    <label htmlFor="editIsPrivate" className="text-sm text-gray-700">Private Group (Only accessible via link)</label>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:gap-2 pt-2">
                                    <button onClick={handleSaveGroup} className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">Save Changes</button>
                                    <button onClick={() => setIsEditing(false)} className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm mt-2 sm:mt-0">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center md:text-left">
                                <div className="flex flex-col md:flex-row items-center md:justify-between gap-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{group.name}</h1>
                                        {group.type === 'CLUB' && <span className="bg-indigo-100 text-indigo-700 text-[10px] md:text-xs px-2 py-0.5 rounded-full font-bold">CLUB</span>}
                                        {group.status === 'SUSPENDED' && <span className="bg-red-600 text-white text-[10px] md:text-xs px-2 py-0.5 rounded-full font-bold">SUSPENDED</span>}
                                    </div>
                                    {(userRole === 'OWNER' || user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
                                        <button onClick={() => setIsEditing(true)} className="text-xs md:text-sm text-gray-400 hover:text-indigo-600 underline">
                                            Edit Details
                                        </button>
                                    )}
                                </div>
                                <p className="text-sm md:text-base text-gray-600">{group.description}</p>
                            </div>
                        )}
                        <div className="flex justify-center md:justify-start gap-4 md:gap-6 mt-4 text-xs md:text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Users size={16} /> {group._count?.members || 0} Members</span>
                            <span className="flex items-center gap-1"><MapPin size={16} /> Global</span>
                        </div>
                    </div>

                    {group.status !== 'SUSPENDED' && (
                        <div className="flex gap-4 md:gap-6 mt-8 border-b border-gray-100 overflow-x-auto scrollbar-hide">
                            <button onClick={() => setActiveTab('feed')} className={`pb-3 text-xs md:text-sm font-medium whitespace-nowrap ${activeTab === 'feed' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Activity Feed</button>
                            <button onClick={() => setActiveTab('challenges')} className={`pb-3 text-xs md:text-sm font-medium whitespace-nowrap ${activeTab === 'challenges' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Challenges</button>
                            <button onClick={() => setActiveTab('members')} className={`pb-3 text-xs md:text-sm font-medium whitespace-nowrap ${activeTab === 'members' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Members</button>
                            {group.isSuspended && (
                                <button onClick={() => setActiveTab('appeal')} className={`pb-3 text-xs md:text-sm font-medium whitespace-nowrap ${activeTab === 'appeal' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-orange-500 hover:text-orange-700'}`}>Appeal Ban</button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {group.status === 'SUSPENDED' ? (
                <div className="bg-white rounded-xl shadow-sm border border-red-100 p-12 text-center">
                    <div className="text-4xl mb-4">🚫</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Group Suspended</h2>
                    <p className="text-gray-500 max-w-md mx-auto">
                        This group's content is currently unavailable because it has been suspended by an administrator.
                    </p>
                </div>
            ) : (
                <>
                    {activeTab === 'challenges' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-900">Active Challenges</h2>
                                <button onClick={handleCreateChallenge} className="text-sm text-indigo-600 font-medium hover:underline">+ Create Challenge</button>
                            </div>
                            <div className="grid gap-4">
                                {challenges.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No active challenges.</p>
                                ) : (
                                    challenges.map(challenge => (
                                        <div key={challenge.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                            <div className="flex gap-4">
                                                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600 overflow-hidden">
                                                    {challenge.trophyImage ? (
                                                        <img src={challenge.trophyImage} alt="Trophy" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Trophy size={24} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-gray-900">{challenge.title}</h3>
                                                        {challenge.condition === 'SINGLE' && (
                                                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold border border-purple-200">SINGLE RIDE</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600">Goal: {challenge.goal} {challenge.type === 'DISTANCE' ? 'km' : challenge.type === 'TIME' ? 's' : 'rides'} • Ends {new Date(challenge.endDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            {/* @ts-ignore */}
                                            {challenge.participants && challenge.participants.length > 0 ? (
                                                <button disabled className="px-4 py-2 bg-green-50 text-green-600 rounded-md text-sm font-medium border border-green-100 flex items-center gap-1">
                                                    <span>✓</span> Joined
                                                </button>
                                            ) : (
                                                <button onClick={() => handleJoinChallenge(challenge.id)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">
                                                    Join
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'feed' && (
                        <div className="max-w-3xl mx-auto">
                            {/* Show suspension warning for feed */}
                            {group.isSuspended && (
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-orange-800">
                                        <span className="font-semibold">⚠️ Suspended:</span> You can view posts but cannot create new ones, comment, or like until your ban expires or is lifted.
                                    </p>
                                </div>
                            )}

                            {/* Show post creation only if:
                        - User is joined AND
                        - (Group is a GROUP OR user is OWNER in CLUB) AND
                        - Group is NOT SUSPENDED 
                        - User is NOT SUSPENDED */}
                            {isJoined && (group.type !== 'CLUB' || userRole === 'OWNER') && group.status !== 'SUSPENDED' && !group.isSuspended && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                                    <div className="flex gap-4">
                                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold overflow-hidden">
                                            {user?.image ? (
                                                <img
                                                    src={user.image.startsWith('http') ? user.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${user.image}`}
                                                    alt="My Profile Picture"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                user?.firstName?.[0]
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <textarea
                                                value={newPostContent}
                                                onChange={(e) => setNewPostContent(e.target.value)}
                                                placeholder={group.type === 'CLUB' ? "Share something with the club..." : "Share something with the group..."}
                                                className="w-full border-0 focus:ring-0 text-gray-900 placeholder-gray-400 resize-none h-20 p-2"
                                            />
                                            <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                                                <div className="text-xs text-gray-400">Markdown supported</div>
                                                <button
                                                    onClick={handlePost}
                                                    disabled={!newPostContent.trim()}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    <Send size={14} /> Post
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Info message for club members who can't post */}
                            {isJoined && group.type === 'CLUB' && userRole !== 'OWNER' && !group.isSuspended && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                                    <p className="text-sm text-blue-800">
                                        <span className="font-semibold">ℹ️ Club Member:</span> Only the club owner can create posts. You can like and comment on existing posts.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {posts.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
                                        Be the first to post! 🚴‍♂️
                                    </div>
                                ) : (
                                    posts.map((post: any) => (
                                        <GroupPostCard key={post.id} post={post} currentUser={user} targetId={targetPostId} isSuspended={group.isSuspended} />
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'appeal' && (
                        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Appeal Your Suspension</h2>

                            {group.banAppealStatus === 'PENDING' ? (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                                    <div className="text-3xl mb-2">⏳</div>
                                    <h3 className="font-bold text-blue-900 mb-1">Appeal Pending</h3>
                                    <p className="text-sm text-blue-800 mb-4">
                                        You have already submitted an appeal. Our moderators will review it shortly.
                                    </p>
                                    <div className="bg-white/50 rounded-lg p-3 text-left">
                                        <p className="text-xs font-semibold text-blue-500 uppercase mb-1">Your Message:</p>
                                        <p className="text-sm text-gray-700">{group.banAppealMessage}</p>
                                    </div>
                                </div>
                            ) : group.banAppealStatus === 'RESOLVED' ? (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                    <div className="text-3xl mb-2">✅</div>
                                    <h3 className="font-bold text-green-900 mb-1">Appeal Resolved</h3>
                                    <p className="text-sm text-green-800">
                                        Your previous appeal was resolved. If you are still suspended, it may be due to a new violation.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-gray-600 mb-6 text-sm">
                                        If you believe your suspension was a mistake, please provide a brief explanation below. An administrator will review your case.
                                    </p>
                                    <div className="space-y-4">
                                        <textarea
                                            value={appealMessage}
                                            onChange={(e) => setAppealMessage(e.target.value)}
                                            placeholder="Explain why your suspension should be lifted..."
                                            className="w-full border border-gray-200 rounded-lg p-4 h-40 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                        <button
                                            onClick={handleSubmitAppeal}
                                            disabled={!appealMessage.trim() || isSubmittingAppeal}
                                            className="w-full py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-md"
                                        >
                                            {isSubmittingAppeal ? 'Submitting...' : 'Submit Appeal'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    {activeTab === 'members' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-900">Group Members</h2>
                                <span className="text-sm text-gray-500 font-medium">{members.length} Members</span>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {members.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">No members found.</div>
                                ) : (
                                    members.map((member: any) => (
                                        <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden relative">
                                                    {member.user.image ? (
                                                        <img
                                                            src={member.user.image.startsWith('http') ? member.user.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${member.user.image}`}
                                                            alt={`${member.user.firstName} ${member.user.lastName}'s Profile Picture`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold text-xl uppercase">
                                                            {member.user.firstName?.[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <Link href={`/cyclist/${member.user.username}`} className="font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                                                        {member.user.firstName} {member.user.lastName}
                                                    </Link>
                                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                                        @{member.user.username}
                                                        {member.role !== 'MEMBER' && (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${member.role === 'OWNER' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                                                                }`}>
                                                                {member.role}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {member.user.city && (
                                                        <div className="text-xs text-gray-400 mt-0.5">
                                                            📍 {member.user.city}, {member.user.country}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {member.status === 'SUSPENDED' && (
                                                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold uppercase">
                                                        SUSPENDED
                                                    </span>
                                                )}
                                                {(userRole === 'OWNER' || user?.role === 'ADMIN' || user?.role === 'EDITOR') && member.status === 'SUSPENDED' && (
                                                    <button
                                                        onClick={() => handleLiftBan(member.user.id)}
                                                        className="text-[10px] font-bold uppercase tracking-wider text-green-600 hover:text-green-700 px-3 py-1.5 bg-green-50 rounded-md transition-colors"
                                                    >
                                                        Lift Ban
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/cyclist/${member.user.username}`}
                                                    className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 px-3 py-1.5 bg-indigo-50 rounded-md transition-colors"
                                                >
                                                    View Profile
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {showInviteModal && (
                        <InviteModal
                            title={group.name}
                            targetId={group.id}
                            type="group"
                            onClose={() => setShowInviteModal(false)}
                        />
                    )}

                    {showReportModal && (
                        <ReportModal
                            isOpen={showReportModal}
                            onClose={() => setShowReportModal(false)}
                            entityId={group.id}
                            entityType="group"
                        />
                    )}
                </>
            )}
        </DashboardLayout>
    );
}
