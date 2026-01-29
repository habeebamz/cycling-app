
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityId: string;
    entityType: 'post' | 'user' | 'activity' | 'group' | 'event';
}

const REASONS = [
    'Spam',
    'Inappropriate content',
    'Harassment',
    'Misinformation',
    'Fake Profile/Content',
    'Violation of community guidelines',
    'Other'
];

export default function ReportModal({ isOpen, onClose, entityId, entityType }: ReportModalProps) {
    const [reason, setReason] = useState(REASONS[0]);
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload: any = { reason, details };

            // Map entity type to API field
            if (entityType === 'post') payload.postId = entityId;
            else if (entityType === 'user') payload.targetUserId = entityId;
            else if (entityType === 'activity') payload.activityId = entityId;
            else if (entityType === 'group') payload.groupId = entityId;
            else if (entityType === 'event') payload.eventId = entityId;

            console.log('Submitting report:', payload);
            const response = await api.post('/reports', payload);
            console.log('Report submitted successfully:', response.data);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 2000);
        } catch (error: any) {
            console.error('Failed to submit report', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            const errorMessage = error.response?.data?.message || 'Failed to submit report. Please try again.';
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="text-red-500" size={20} />
                        Report {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-100">
                        <X size={20} />
                    </button>
                </div>

                {success ? (
                    <div className="p-8 text-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Report Submitted</h3>
                        <p className="text-gray-500">Thank you for helping us keep the community safe. An admin will review your report shortly.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6">
                        <p className="text-sm text-gray-500 mb-6">
                            Please select a reason for reporting this {entityType}. Your report will be reviewed by our moderation team.
                        </p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Report</label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    required
                                >
                                    {REASONS.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Details (Optional)</label>
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder="Provide more context..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all min-h-[100px] resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-4 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {submitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
