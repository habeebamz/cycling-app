
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Creating Test Group...');
    await prisma.group.create({
        data: {
            name: 'Morning Riders Group',
            description: 'A community for morning riders.',
            type: 'GROUP',
            isPrivate: false
        }
    });
    console.log('Group created.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
