
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateGlobalPrivacy() {
    console.log('Updating Global Challenges privacy...');

    // Find all challenges where groupId is null
    const globalChallenges = await prisma.challenge.findMany({
        where: { groupId: null }
    });

    console.log(`Found ${globalChallenges.length} global challenges.`);

    for (const challenge of globalChallenges) {
        if (challenge.isPrivate) {
            console.log(`Updating "${challenge.title}" to Public...`);
            await prisma.challenge.update({
                where: { id: challenge.id },
                data: {
                    // @ts-ignore
                    isPrivate: false
                }
            });
        } else {
            console.log(`"${challenge.title}" is already Public.`);
        }
    }

    console.log('Privacy update complete.');
}

updateGlobalPrivacy()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
