/**
 * Quick test script to verify cyclist profile metadata is being generated
 * Run this to check if the metadata API is working correctly
 */

const API_URL = 'http://localhost:3001';

async function testMetadata() {
    try {
        console.log('Testing metadata generation for cyclist profile...\n');

        // Test fetching a profile
        const username = 'habeebrahmanb';
        console.log(`Fetching profile for: ${username}`);

        const response = await fetch(`${API_URL}/api/users/${username}`);

        if (!response.ok) {
            console.error(`❌ Failed to fetch profile: ${response.status} ${response.statusText}`);
            return;
        }

        const profile = await response.json();
        console.log('✅ Profile fetched successfully\n');

        // Display what metadata would be generated
        const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.username;
        const location = [profile.city, profile.state, profile.country].filter(Boolean).join(', ');

        console.log('=== METADATA PREVIEW ===\n');

        // Title
        const title = location
            ? `${fullName} - Cyclist from ${location} | CyclingApp`
            : `${fullName} - Cyclist Profile | CyclingApp`;
        console.log(`Title: ${title}\n`);

        // Description
        const stats = [];
        if (profile.totalDistance) stats.push(`${Math.round(profile.totalDistance)}km ridden`);
        if (profile._count?.activities) stats.push(`${profile._count.activities} activities`);
        if (profile._count?.followers) stats.push(`${profile._count.followers} followers`);

        const statsText = stats.length > 0 ? ` | ${stats.join(', ')}` : '';
        const bioText = profile.bio
            ? `${profile.bio.slice(0, 120)}${profile.bio.length > 120 ? '...' : ''}`
            : `View ${fullName}'s cycling profile, activities, and stats on CyclingApp`;
        const description = `${bioText}${statsText}`;
        console.log(`Description: ${description}\n`);

        // Keywords
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
        console.log(`Keywords: ${keywords}\n`);

        // Robots
        console.log(`Robots: ${profile.isPublic ? 'index, follow' : 'noindex, nofollow'}\n`);

        // OG Image
        const ogImage = profile.image
            ? (profile.image.startsWith('http') ? profile.image : `${API_URL}${profile.image}`)
            : 'http://localhost:3000/og-default.png';
        console.log(`OG Image: ${ogImage}\n`);

        console.log('=== PROFILE DATA ===\n');
        console.log(`Username: ${profile.username}`);
        console.log(`Name: ${fullName}`);
        console.log(`Location: ${location || 'Not specified'}`);
        console.log(`Bio: ${profile.bio || 'Not specified'}`);
        console.log(`Bike: ${profile.bikeModel || 'Not specified'}`);
        console.log(`Total Distance: ${profile.totalDistance || 0} km`);
        console.log(`Activities: ${profile._count?.activities || 0}`);
        console.log(`Followers: ${profile._count?.followers || 0}`);
        console.log(`Public Profile: ${profile.isPublic ? 'Yes' : 'No'}`);

        console.log('\n✅ Metadata generation test completed successfully!');

    } catch (error) {
        console.error('❌ Error testing metadata:', error.message);
    }
}

testMetadata();
