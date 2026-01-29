
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateNewId = async (): Promise<string> => {
    let id = '';
    let exists = true;
    while (exists) {
        id = Math.floor(100000 + Math.random() * 900000).toString();
        const found = await prisma.event.findUnique({ where: { id } });
        if (!found) exists = false;
    }
    return id;
};

async function migrate() {
    console.log('Starting Event ID migration...');
    try {
        const events = await prisma.event.findMany();

        console.log(`Found ${events.length} events to check.`);

        for (const event of events) {
            // Check if ID is already 6 digits
            if (/^\d{6}$/.test(event.id)) {
                console.log(`Event ${event.title} (${event.id}) is already migrated.`);
                continue;
            }

            const newId = await generateNewId();
            console.log(`Migrating Event: ${event.title} | Old ID: ${event.id} -> New ID: ${newId}`);

            await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');

            try {
                // Update Event ID
                await prisma.$executeRawUnsafe(`UPDATE "Event" SET id = '${newId}' WHERE id = '${event.id}'`);

                // Update Relations
                await prisma.$executeRawUnsafe(`UPDATE "EventParticipant" SET eventId = '${newId}' WHERE eventId = '${event.id}'`);
                await prisma.$executeRawUnsafe(`UPDATE "Badge" SET eventId = '${newId}' WHERE eventId = '${event.id}'`);

                // Update "Notification" links if possible (basic string replace)
                // This is a bit risky if multiple events have same ID substring, but UUIDs are unique enough.
                const oldLink = `/events/${event.id}`;
                const newLink = `/events/${newId}`;
                await prisma.$executeRawUnsafe(`UPDATE "Notification" SET link = REPLACE(link, '${oldLink}', '${newLink}') WHERE link LIKE '%${oldLink}%'`);
                const oldDashLink = `/dashboard/events/${event.id}`;
                await prisma.$executeRawUnsafe(`UPDATE "Notification" SET link = REPLACE(link, '${oldDashLink}', '${newLink}') WHERE link LIKE '%${oldDashLink}%'`);

                console.log(`Successfully migrated ${event.title}`);
            } catch (err) {
                console.error(`Failed to migrate ${event.title}`, err);
            } finally {
                await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
            }
        }

        console.log('Event migration complete.');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
