
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { username: 'admin' }
    });
    if (user) {
        console.log('User found:', user.username);
        console.log('Role:', user.role);
        console.log('Password Hash exists:', !!user.password);
    } else {
        console.log('User "admin" NOT found.');
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
