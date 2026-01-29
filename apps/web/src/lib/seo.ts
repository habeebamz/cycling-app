/**
 * SEO Utility Library
 * Centralized functions for generating SEO metadata, structured data, and social tags
 */

import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'CyclingApp';
const DEFAULT_OG_IMAGE = process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE || '/og-default.png';

interface CyclistProfile {
    username: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    city?: string;
    state?: string;
    country?: string;
    bikeModel?: string;
    image?: string;
    isPublic?: boolean;
    totalDistance?: number;
    longestRideDistance?: number;
    totalElevationGain?: number;
    totalDuration?: number;
    _count?: {
        activities?: number;
        followers?: number;
        following?: number;
    };
    facebook?: string;
    instagram?: string;
}

/**
 * Generate metadata for cyclist profile pages
 */
export function generateCyclistMetadata(profile: CyclistProfile): Metadata {
    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.username;
    const location = [profile.city, profile.state, profile.country].filter(Boolean).join(', ');

    // Build title
    const title = location
        ? `${fullName} - Cyclist from ${location} | ${SITE_NAME}`
        : `${fullName} - Cyclist Profile | ${SITE_NAME}`;

    // Build description
    const stats = [];
    if (profile.totalDistance) stats.push(`${Math.round(profile.totalDistance)}km ridden`);
    if (profile._count?.activities) stats.push(`${profile._count.activities} activities`);
    if (profile._count?.followers) stats.push(`${profile._count.followers} followers`);

    const statsText = stats.length > 0 ? ` | ${stats.join(', ')}` : '';
    const bioText = profile.bio ? `${profile.bio.slice(0, 120)}${profile.bio.length > 120 ? '...' : ''}` :
        `View ${fullName}'s cycling profile, activities, and stats`;
    const description = `${bioText}${statsText}`;

    // Build keywords
    const keywords = [
        fullName,
        'cyclist',
        'cycling profile',
        profile.city,
        profile.state,
        profile.country,
        profile.bikeModel,
        'cycling activities',
        'bike rides',
        'cycling stats'
    ].filter(Boolean).join(', ');

    // Profile image for OG
    const ogImage = profile.image
        ? (profile.image.startsWith('http') ? profile.image : `${SITE_URL}${profile.image}`)
        : `${SITE_URL}${DEFAULT_OG_IMAGE}`;

    const url = `${SITE_URL}/cyclist/${profile.username}`;

    return {
        title,
        description,
        keywords,
        robots: profile.isPublic ? 'index, follow' : 'noindex, nofollow',
        alternates: {
            canonical: url,
        },
        openGraph: {
            type: 'profile',
            title,
            description,
            url,
            siteName: SITE_NAME,
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: `${fullName}'s profile picture`,
                },
            ],
            locale: 'en_US',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    };
}

/**
 * Generate JSON-LD structured data for cyclist profile
 */
export function generateCyclistSchema(profile: CyclistProfile) {
    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.username;
    const location = [profile.city, profile.state, profile.country].filter(Boolean).join(', ');
    const url = `${SITE_URL}/cyclist/${profile.username}`;
    const imageUrl = profile.image
        ? (profile.image.startsWith('http') ? profile.image : `${SITE_URL}${profile.image}`)
        : undefined;

    const sameAs = [];
    if (profile.facebook) sameAs.push(profile.facebook);
    if (profile.instagram) sameAs.push(profile.instagram);

    return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: fullName,
        url,
        image: imageUrl,
        description: profile.bio,
        ...(location && { address: { '@type': 'PostalAddress', addressLocality: location } }),
        ...(sameAs.length > 0 && { sameAs }),
        // Custom properties for cycling
        knowsAbout: 'Cycling',
        ...(profile.bikeModel && { owns: { '@type': 'Product', name: profile.bikeModel } }),
        // Add cycling-specific data as additional properties
        additionalProperty: [
            {
                '@type': 'PropertyValue',
                name: 'Total Distance',
                value: `${Math.round(profile.totalDistance || 0)} km`,
            },
            {
                '@type': 'PropertyValue',
                name: 'Total Activities',
                value: profile._count?.activities || 0,
            },
            {
                '@type': 'PropertyValue',
                name: 'Longest Ride',
                value: `${Math.round(profile.longestRideDistance || 0)} km`,
            },
        ].filter(prop => prop.value !== '0 km' && prop.value !== 0),
    };
}

/**
 * Generate metadata for search page
 */
export function generateSearchMetadata(): Metadata {
    return {
        title: `Find Cyclists | ${SITE_NAME}`,
        description: 'Search and discover cyclists from around the world. Connect with fellow riders, follow their activities, and join the cycling community.',
        robots: 'noindex, follow', // Don't index search pages
        alternates: {
            canonical: `${SITE_URL}/cyclist/search`,
        },
    };
}

/**
 * Get base URL for the application
 */
export function getBaseUrl(): string {
    return SITE_URL;
}

/**
 * Get site name
 */
export function getSiteName(): string {
    return SITE_NAME;
}
