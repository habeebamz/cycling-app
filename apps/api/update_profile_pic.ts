import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const username = 'habeebrahmanb';
    // Using the most recent upload based on timestamp inference from filenames
    // 1769574184030 is very recent (approx 2026-01-28 09:43)
    const imagePath = '/uploads/1769574184030-778043937.jpg';

    console.log(`Updating profile picture for ${username}...`);

    try {
        const user = await prisma.user.update({
            where: { username },
            data: {
                image: imagePath
            }
        });

        console.log(`User ${user.username} profile picture updated to: ${user.image}`);
    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
