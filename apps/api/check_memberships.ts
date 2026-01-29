import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const username = 'habeebrahmanb';

    const user = await prisma.user.findUnique({
        where: { username },
        include: {
            groups: {
                include: {
                    group: true
                }
            }
        }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log(`User: ${user.username} (${user.id})`);
    console.log('Group Memberships:');

    if (user.groups.length === 0) {
        console.log('No group memberships found.');
    } else {
        user.groups.forEach(m => {
            console.log(`- Group: ${m.group.name} (ID: ${m.groupId}), Role: ${m.role}`);
        });
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
