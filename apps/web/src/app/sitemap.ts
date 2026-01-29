import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${SITE_URL}/cyclist/search`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
    ];

    // In a production environment, you would fetch all public cyclist profiles
    // from your database and add them to the sitemap
    // For now, we'll return just the static pages

    // Example of how to add dynamic cyclist profiles:
    // const cyclists = await fetchPublicCyclists();
    // const cyclistPages = cyclists.map((cyclist) => ({
    //     url: `${SITE_URL}/cyclist/${cyclist.username}`,
    //     lastModified: cyclist.updatedAt,
    //     changeFrequency: 'weekly' as const,
    //     priority: 0.7,
    // }));

    return [
        ...staticPages,
        // ...cyclistPages,
    ];
}
