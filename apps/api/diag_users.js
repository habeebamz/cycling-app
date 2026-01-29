const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    console.log('--- User & Follow Relations Diagnostic ---');
    const users = await p.user.findMany({
        include: {
            following: true,
            followedBy: true
        }
    });

    if (users.length === 0) {
        console.log('No users found in database.');
        return;
    }

    users.forEach(u => {
        console.log(`User: ${u.username} (${u.id})`);
        console.log(`  People they follow (Following): ${u.following.map(f => f.followingId).join(', ') || 'None'}`);
        console.log(`  People who follow them (Followers): ${u.followedBy.map(f => f.followerId).join(', ') || 'None'}`);
    });

    console.log('-----------------------------------------');
}

main().catch(console.error).finally(() => p.$disconnect());
