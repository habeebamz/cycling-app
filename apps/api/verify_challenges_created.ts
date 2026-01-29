
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Verifying Monthly Challenges ---');
    const challenges = await prisma.challenge.findMany({
        where: {
            // Check for current month challenges
            groupId: null // Global
        }
    });

    console.log(`Found ${challenges.length} global challenges.`);
    if (challenges.length > 0) {
        console.log('Sample Challenge:', challenges[0]);
    } else {
        console.log('WARNING: No global challenges found.');
        const userCount = await prisma.user.count();
        console.log('Total Users in DB:', userCount);
        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        console.log('Admin found?', !!admin);
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
