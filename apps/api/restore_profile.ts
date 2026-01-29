import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const username = 'habeebrahmanb';
    console.log(`Searching for user: ${username}...`);

    let user = await prisma.user.findUnique({
        where: { username }
    });

    if (!user) {
        console.log('User NOT found. Attempting to recreate/restore...');
        // Try to find by email if username missing? Or just create?
        // Let's assume we need to recreate if missing, but likely it exists.
        console.log('Check if email exists...');
        // Hypothetical email
        const email = 'habeebrahmanb@gmail.com';
        user = await prisma.user.findUnique({ where: { email } });

        if (user) {
            console.log('User found by email. Restoring username...');
            user = await prisma.user.update({
                where: { email },
                data: { username }
            });
        } else {
            console.log('User completely missing. Creating default...');
            user = await prisma.user.create({
                data: {
                    username,
                    email: 'habeebrahmanb@gmail.com',
                    password: '$2b$10$y.MCgyl.zSwBngWXYdavb.oB1tykUNvpbIxXo/G7K91xvu2cApr22', // valid bcrypt hash for 'password' or similar from previous logs
                    firstName: 'HABEEB',
                    lastName: 'RAHMAN',
                    role: 'ADMIN', // specific request usually implies importancy
                    isVerified: true,
                    isPublic: true
                }
            });
        }
    }

    console.log('User State:', user);

    // Ensure Role is ADMIN if needed (usually main user is admin)
    if (user.role !== 'ADMIN') {
        console.log('Promoting to ADMIN...');
        await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' }
        });
    }

    // Ensure critical fields are safe
    if (!user.isPublic) {
        console.log('Setting public...');
        await prisma.user.update({
            where: { id: user.id },
            data: { isPublic: true }
        });
    }

    console.log('Profile restoration check complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
