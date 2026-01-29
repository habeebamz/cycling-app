import { Metadata } from 'next';
import { generateCyclistMetadata } from '@/lib/seo';

// This would ideally fetch the profile data server-side
// For now, we'll provide a basic implementation
export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
    try {
        // In a real implementation, you'd fetch the profile data here
        // For now, return basic metadata
        const username = params.username;

        return {
            title: `${username} - Cyclist Profile | CyclingApp`,
            description: `View ${username}'s cycling profile, activities, and stats on CyclingApp`,
            robots: 'index, follow',
        };
    } catch (error) {
        return {
            title: 'Cyclist Profile | CyclingApp',
            description: 'View cyclist profile on CyclingApp',
        };
    }
}
