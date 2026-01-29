
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateNewId = async (): Promise<string> => {
    let id = '';
    let exists = true;
    while (exists) {
        id = Math.floor(100000 + Math.random() * 900000).toString();
        const found = await prisma.group.findUnique({ where: { id } });
        if (!found) exists = false;
    }
    return id;
};

async function migrate() {
    console.log('Starting Club ID migration...');
    try {
        const clubs = await prisma.group.findMany({
            where: { type: 'CLUB' }
        });

        console.log(`Found ${clubs.length} clubs to check.`);

        for (const club of clubs) {
            // Check if ID is already 6 digits
            if (/^\d{6}$/.test(club.id)) {
                console.log(`Club ${club.name} (${club.id}) is already migrated.`);
                continue;
            }

            const newId = await generateNewId();
            console.log(`Migrating Club: ${club.name} | Old ID: ${club.id} -> New ID: ${newId}`);

            // Since we can't easily update PK with relations in Prisma without Cascade, 
            // and SQLite has limited support, we'll try a transaction with raw queries or strict order.
            // Raw SQL is safest to bypass FK checks if needed, but we can try updating dependents first? 
            // No, dependents point to Old ID. We can't point them to New ID until New ID exists.

            // Strategy: Create new entry -> Update relations -> Delete old entry
            // But we can't create new entry with same data easily (unique constraints etc).

            // SQLite specific: Turn off FKs, update ID, turn on FKs.

            await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');

            try {
                // Update Group ID
                await prisma.$executeRawUnsafe(`UPDATE "Group" SET id = '${newId}' WHERE id = '${club.id}'`);

                // Update Relations
                await prisma.$executeRawUnsafe(`UPDATE "GroupMember" SET groupId = '${newId}' WHERE groupId = '${club.id}'`);
                await prisma.$executeRawUnsafe(`UPDATE "Event" SET groupId = '${newId}' WHERE groupId = '${club.id}'`);
                await prisma.$executeRawUnsafe(`UPDATE "Challenge" SET groupId = '${newId}' WHERE groupId = '${club.id}'`);
                await prisma.$executeRawUnsafe(`UPDATE "Post" SET groupId = '${newId}' WHERE groupId = '${club.id}'`);

                console.log(`Successfully migrated ${club.name}`);
            } catch (err) {
                console.error(`Failed to migrate ${club.name}`, err);
            } finally {
                await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
            }
        }

        console.log('Migration complete.');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
