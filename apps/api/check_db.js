
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: { id: true, username: true, isPublic: true }
    });
    console.log('--- Users ---');
    console.log(users);

    const groups = await prisma.group.findMany({
        select: { id: true, name: true, isPrivate: true, type: true }
    });
    console.log('\n--- Groups/Clubs ---');
    console.log(groups);

    const events = await prisma.event.findMany({
        select: { id: true, title: true, isPrivate: true }
    });
    console.log('\n--- Events ---');
    console.log(events);

    const activities = await prisma.activity.findMany({
        select: { id: true, title: true, userId: true }
    });
    console.log('\n--- Activities ---');
    console.log(activities);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
