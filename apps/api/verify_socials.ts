import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const username = 'habeebrahmanb';
    console.log(`Checking user: ${username}`);

    // 1. Update Profile with Socials
    console.log('Updating profile with socials...');
    try {
        const updated = await prisma.user.update({
            where: { username },
            data: {
                // @ts-ignore
                facebook: 'https://facebook.com/habeeb',
                // @ts-ignore
                instagram: 'https://instagram.com/habeeb'
            }
        });
        console.log('Update success:', updated);
    } catch (e) {
        console.error('Update failed:', e);
    }

    // 2. Fetch Profile
    const user = await prisma.user.findUnique({
        where: { username },
        include: {
            // @ts-ignore
            // actually default findUnique returns scalar fields usually depending on selection
        }
    });

    // @ts-ignore
    console.log('Facebook:', user?.facebook);
    // @ts-ignore
    console.log('Instagram:', user?.instagram);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
