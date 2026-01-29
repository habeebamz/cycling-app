import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const username = 'habeebrahmanb';

    console.log(`Setting up verification for user: ${username}`);
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) throw new Error('User not found');

    // 1. Find or Create a Challenge
    let challenge = await prisma.challenge.findFirst({
        where: { title: 'Test Verification Challenge' }
    });

    if (!challenge) {
        // Need a group first
        const group = await prisma.group.findFirst({ where: { members: { some: { userId: user.id, role: 'OWNER' } } } });
        if (!group) throw new Error('No group found where user is owner');

        challenge = await prisma.challenge.create({
            data: {
                title: 'Test Verification Challenge',
                description: 'Ride 10km to pass.',
                type: 'DISTANCE',
                goal: 10,
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
                groupId: group.id,
                creatorId: user.id
            }
        });
        console.log('Created Test Challenge:', challenge.id);
    } else {
        console.log('Found Test Challenge:', challenge.id);
    }

    // 2. Join Challenge (if not joined)
    const existing = await prisma.challengeParticipant.findUnique({
        where: { userId_challengeId: { userId: user.id, challengeId: challenge.id } }
    });

    if (!existing) {
        await prisma.challengeParticipant.create({
            data: { userId: user.id, challengeId: challenge.id }
        });
        console.log('Joined Challenge');
    } else {
        console.log('Already Joined Challenge');
    }

    // 3. Log Activity (5km)
    console.log('Logging 5km activity...');
    // We simulate the logic from controller here or just insert activity and check if we invoke logic? 
    // Ideally we should call the API, but for script simplicity we can mock the controller logic OR just run the exact logic we added to controller. 
    // Since we can't easily call the controller from here without spinning up express or mocking req/res, 
    // I will use axios to call the running API if possible, OR just trust the manual verification plan.
    // Actually, calling the API is better to test the full flow.

    // BUT, I can't easily authenticate via script without login flow. 
    // So I will just verify that IF I insert activity + update participation manually, it works? No that defeats the purpose.

    // I made changes to `createActivity` controller. 
    // I will verify simply by checking if I can query the participation progress after I manually invoke the logic?
    // Let's rely on the user to test manually in UI, as per plan. 
    // BUT I will create a small script that mimics the Controller Logic to ensure it compiles/runs against DB correctly.

    // Simulate what the controller does:
    const activeChallenges = await prisma.challengeParticipant.findMany({
        where: {
            userId: user.id,
            completed: false,
            challenge: {
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
                id: challenge.id // Target specific
            }
        },
        include: { challenge: true }
    });

    console.log(`Found ${activeChallenges.length} active challenges to update.`);

    const distance = 5; // km

    for (const participant of activeChallenges) {
        const c = participant.challenge;
        let progressIncrement = 0;
        if (c.type === 'DISTANCE') progressIncrement = distance;

        if (progressIncrement > 0) {
            const newProgress = participant.progress + progressIncrement;
            const isCompleted = newProgress >= c.goal;

            console.log(`Updating progress: ${participant.progress} -> ${newProgress}. Completed: ${isCompleted}`);

            await prisma.challengeParticipant.update({
                where: { id: participant.id },
                data: {
                    progress: newProgress,
                    completed: isCompleted ? true : undefined
                }
            });
        }
    }

    // 4. Check Result
    const updatedParticipant = await prisma.challengeParticipant.findUnique({
        where: { userId_challengeId: { userId: user.id, challengeId: challenge.id } }
    });
    console.log('Final Progress:', updatedParticipant?.progress);

    // Clean up
    // await prisma.challenge.delete({ where: { id: challenge.id } }); // Cascades?
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
