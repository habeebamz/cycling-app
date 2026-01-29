
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({ where: { username: 'habeebrahmanb' } });
    if (!user) throw new Error('User not found');

    const club = await prisma.group.findFirst({ where: { type: 'CLUB' } });

    console.log('Creating Test Event...');
    await prisma.event.create({
        data: {
            id: '123456',
            title: 'Test Ride Event',
            description: 'A fun test ride for everyone!',
            startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            location: 'Central Park',
            creatorId: user.id,
            groupId: club ? club.id : undefined,
            participants: {
                create: { userId: user.id, role: 'OWNER', status: 'GOING' }
            }
        }
    });
    console.log('Event created.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
