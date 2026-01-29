
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
    console.log('Starting migration of Challenge IDs...');

    const challenges = await prisma.challenge.findMany({
        include: { participants: true }
    });

    console.log(`Found ${challenges.length} challenges.`);

    for (const challenge of challenges) {
        // Check if ID is already 8-digit numeric
        if (/^\d{8}$/.test(challenge.id)) {
            console.log(`Challenge ${challenge.title} (${challenge.id}) is already migrated. Skipping.`);
            continue;
        }

        const newId = Math.floor(10000000 + Math.random() * 90000000).toString();
        console.log(`Migrating "${challenge.title}" from ${challenge.id} to ${newId}...`);

        try {
            // Strategy 1: Direct Update
            // This works if FK constraints allow ON UPDATE CASCADE or are deferred/not enforced strictly by Prisma here
            // Prisma doesn't natively support changing ID if it has relations unless CASCADE is set in DB.
            // Let's try creating a NEW one and moving relations.

            // 1. Create new challenge
            await prisma.challenge.create({
                data: {
                    id: newId,
                    title: challenge.title,
                    description: challenge.description,
                    type: challenge.type,
                    condition: challenge.condition,
                    goal: challenge.goal,
                    startDate: challenge.startDate,
                    endDate: challenge.endDate,
                    image: challenge.image,
                    trophyImage: challenge.trophyImage,
                    groupId: challenge.groupId,
                    creatorId: challenge.creatorId,
                    createdAt: challenge.createdAt,
                    updatedAt: challenge.updatedAt
                }
            });

            // 2. Move participants
            for (const p of challenge.participants) {
                await prisma.challengeParticipant.update({
                    where: { id: p.id },
                    data: { challengeId: newId }
                });
            }

            // 3. Delete old challenge
            // We must delete the old one. Participants are moved, so we just delete the challenge.
            // But wait, we moved participants by update. So they now point to newId.
            // So old challenge has NO participants now.
            await prisma.challenge.delete({
                where: { id: challenge.id }
            });

            console.log(`Successfully migrated "${challenge.title}".`);

        } catch (error) {
            console.error(`Failed to migrate "${challenge.title}":`, error);
            // Try to cleanup if new one was created but old one not deleted?
            // Ignoring for now, manual cleanup might be needed if script crashes mid-way.
        }
    }

    console.log('Migration complete.');
}

migrate()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
