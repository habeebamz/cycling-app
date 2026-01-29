const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                role: true
            },
            take: 5
        });

        console.log('Users in database:');
        console.log(JSON.stringify(users, null, 2));

        // Also check activities
        const activities = await prisma.activity.findMany({
            select: {
                id: true,
                title: true,
                userId: true
            },
            take: 3
        });

        console.log('\nActivities in database:');
        console.log(JSON.stringify(activities, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
