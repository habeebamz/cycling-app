import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyNotifications() {
    console.log('--- Checking for recent notifications ---');

    const notifications = await prisma.notification.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            type: true,
            message: true,
            read: true,
            createdAt: true,
            userId: true
        }
    });

    if (notifications.length === 0) {
        console.log('No notifications found in the database.');
    } else {
        notifications.forEach(n => {
            console.log(`[${n.createdAt.toISOString()}] ${n.type}: ${n.message} (User: ${n.userId}, Read: ${n.read})`);
        });
    }

    console.log('\n--- Count by Type ---');
    const counts = await prisma.notification.groupBy({
        by: ['type'],
        _count: true
    });
    console.table(counts);

    await prisma.$disconnect();
}

verifyNotifications().catch(console.error);
