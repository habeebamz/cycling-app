import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const userId = process.argv[2];
    if (!userId) {
        console.error('Please provide a user ID');
        return;
    }

    console.log(`Checking followers for user: ${userId}`);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            followedBy: {
                include: {
                    follower: true
                }
            }
        }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log(`User: ${user.username} (${user.id})`);
    console.log(`Followers count: ${user.followedBy.length}`);
    user.followedBy.forEach(f => {
        console.log(`- ${f.follower.username} (${f.follower.id})`);
    });

    // Test the logic I used in controller: User following this user
    const followingMe = await prisma.user.findMany({
        where: {
            following: { some: { followingId: userId } }
        }
    });

    console.log(`\nLogic "Users who follow me" (User.findMany with following filter):`);
    console.log(`Count: ${followingMe.length}`);
    followingMe.forEach(u => {
        console.log(`- ${u.username} (${u.id})`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
