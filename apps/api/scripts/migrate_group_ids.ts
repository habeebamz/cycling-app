
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateGroupId = async (): Promise<string> => {
    let id = '';
    let exists = true;
    while (exists) {
        id = Math.floor(100000 + Math.random() * 900000).toString();
        const found = await prisma.group.findUnique({ where: { id } });
        if (!found) exists = false;
    }
    return id;
};

async function main() {
    console.log('Starting migration of Group IDs...');

    const allGroups = await prisma.group.findMany();
    const oldGroups = allGroups.filter(g => g.id.length > 6);

    console.log(`Found ${oldGroups.length} groups to migrate.`);

    for (const group of oldGroups) {
        const newId = await generateGroupId();
        console.log(`Migrating "${group.name}" (${group.id}) -> ${newId}`);

        // 1. Create new Group
        // We can't just update the ID because of foreign key constraints usually, 
        // unless Cascade Update is on. To be safe, we create new and move.
        // Actually, let's try to see if we can just create a new one and then move relations.

        // However, Prisma doesn't support changing ID easily if relations exist without cascade.
        // Strategy: Create NEW group, Move relations, Delete OLD group.

        try {
            const newGroup = await prisma.group.create({
                data: {
                    id: newId,
                    name: group.name,
                    description: group.description,
                    image: group.image,
                    profileImage: group.profileImage,
                    type: group.type,
                    isPrivate: group.isPrivate,
                    status: group.status,
                    isVerified: group.isVerified,
                    createdAt: group.createdAt,
                    updatedAt: group.updatedAt
                }
            });

            // 2. Move Relations

            // GroupMembers
            const members = await prisma.groupMember.updateMany({
                where: { groupId: group.id },
                data: { groupId: newId }
            });
            console.log(`  Moved ${members.count} members.`);

            // Events
            const events = await prisma.event.updateMany({
                where: { groupId: group.id },
                data: { groupId: newId }
            });
            console.log(`  Moved ${events.count} events.`);

            // Challenges
            const challenges = await prisma.challenge.updateMany({
                where: { groupId: group.id },
                data: { groupId: newId }
            });
            console.log(`  Moved ${challenges.count} challenges.`);

            // Posts
            const posts = await prisma.post.updateMany({
                where: { groupId: group.id },
                data: { groupId: newId }
            });
            console.log(`  Moved ${posts.count} posts.`);

            // Notifications
            // Update links in notifications: /groups/OLD_ID -> /groups/NEW_ID
            // and /clubs/OLD_ID -> /clubs/NEW_ID
            const notifications = await prisma.notification.findMany({
                where: {
                    link: { contains: group.id }
                }
            });

            for (const notif of notifications) {
                if (notif.link) {
                    const newLink = notif.link.replace(group.id, newId);
                    await prisma.notification.update({
                        where: { id: notif.id },
                        data: { link: newLink }
                    });
                }
            }
            console.log(`  Updated ${notifications.length} notifications.`);

            // 3. Delete Old Group
            await prisma.group.delete({
                where: { id: group.id }
            });
            console.log(`  Deleted old group.`);

        } catch (e) {
            console.error(`  FAILED to migrate group ${group.id}:`, e);
        }
    }

    console.log('Migration complete.');
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
