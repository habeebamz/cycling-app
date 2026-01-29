
import React, { useState, useRef } from 'react';
import { Upload, Loader2, ImagePlus } from 'lucide-react';
import api from '@/lib/api';

interface ProfilePictureUploadProps {
    currentImage?: string;
    onUploadComplete: (url: string) => void;
    label?: string;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
    currentImage,
    onUploadComplete,
    label = "Upload Profile Picture"
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('File size must be less than 5MB');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await api.post('/upload/profile-picture', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            onUploadComplete(response.data.url);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="flex flex-col gap-2">
            {label && <label className="text-xs font-semibold text-gray-500 uppercase">{label}</label>}

            <div className="flex items-center gap-3">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4" />
                            Upload Image
                        </>
                    )}
                </button>

                {currentImage && !isUploading && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                        ✓ Image Set
                    </span>
                )}
            </div>
            <p className="text-xs text-gray-500">Max size: 5MB. Formats: JPG, PNG, WEBP.</p>
        </div>
    );
};

export default ProfilePictureUpload;
