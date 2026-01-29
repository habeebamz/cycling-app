
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.update({
        where: { username: 'habeebrahmanb' },
        data: { role: 'ADMIN' }
    });
    console.log('Updated user:', user.username, 'to role:', user.role);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
