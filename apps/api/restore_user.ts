import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const username = 'habeebrahmanb';
    const password = 'password123';
    const email = 'habeebrahmanb@example.com'; // Dummy email

    console.log(`Restoring user ${username}...`);

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { username },
            update: {
                status: 'ACTIVE',
                password: hashedPassword
            },
            create: {
                username,
                email,
                password: hashedPassword,
                firstName: 'Habeeb',
                lastName: 'Rahman',
                role: 'USER', // Assuming default role
                status: 'ACTIVE',
                isVerified: true,
                bikeModel: 'Road Bike',
                city: 'New York',
                country: 'USA'
            }
        });

        console.log(`User ${user.username} restored successfully.`);
        console.log(`Password set to: ${password}`);
    } catch (error) {
        console.error('Error restoring user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
