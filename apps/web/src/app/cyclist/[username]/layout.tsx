import { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'; // Force IPv4 default
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'CyclingApp';

async function getCyclistProfile(username: string) {
    const fetchUrl = `${API_URL}/api/users/${username}`;
    console.log(`[ServerFetch] Fetching profile from: ${fetchUrl}`);
    try {
        const res = await fetch(fetchUrl, {
            cache: 'no-store', // Always fetch fresh data for SEO
        });

        if (!res.ok) {
            console.error(`[ServerFetch] Failed to fetch profile. Status: ${res.status} ${res.statusText}`);
            return null;
        }

        return await res.json();
    } catch (error) {
        console.error(`[ServerFetch] Error fetching cyclist profile (${fetchUrl}):`, error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
    const { username } = await params;
    const profile = await getCyclistProfile(username);

    if (!profile) {
        return {
            title: 'Cyclist Not Found | CyclingApp',
            description: 'The cyclist profile you are looking for could not be found.',
            robots: 'noindex, nofollow',
        };
    }

    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.username;
    const location = [profile.city, profile.state, profile.country].filter(Boolean).join(', ');

    // Build title
    const title = location
        ? `${fullName} - Cyclist from ${location}`
        : `${fullName} - Cyclist Profile`;

    // Build description with stats
    const stats = [];
    if (profile.totalDistance) stats.push(`${Math.round(profile.totalDistance)}km ridden`);
    if (profile._count?.activities) stats.push(`${profile._count.activities} activities`);
    if (profile._count?.followers) stats.push(`${profile._count.followers} followers`);

    const statsText = stats.length > 0 ? ` | ${stats.join(', ')}` : '';
    const bioText = profile.bio
        ? `${profile.bio.slice(0, 120)}${profile.bio.length > 120 ? '...' : ''}`
        : `View ${fullName}'s cycling profile, activities, and stats on ${SITE_NAME}`;
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
        'cycling stats',
        'cycling community'
    ].filter(Boolean).join(', ');

    // Profile image for OG
    const ogImage = profile.image
        ? (profile.image.startsWith('http') ? profile.image : `${API_URL}${profile.image}`)
        : `${SITE_URL}/og-default.png`;

    const url = `${SITE_URL}/cyclist/${profile.username}`;

    return {
        title,
        description,
        keywords,
        robots: profile.isPublic ? 'index, follow' : 'noindex, nofollow',
        authors: [{ name: fullName }],
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
            creator: profile.username ? `@${profile.username}` : undefined,
        },
        other: {
            // Additional meta tags
            'profile:username': profile.username,
            'profile:first_name': profile.firstName || '',
            'profile:last_name': profile.lastName || '',
        },
    };
}

export default function CyclistProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
