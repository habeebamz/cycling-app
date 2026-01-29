
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: {
            resetPasswordToken: { not: null }
        },
        select: {
            email: true,
            resetPasswordToken: true,
            resetPasswordExpires: true
        }
    });
    console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
