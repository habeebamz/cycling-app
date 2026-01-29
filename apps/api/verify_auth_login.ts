import { PrismaClient } from '@prisma/client';
import { comparePassword } from './src/utils/auth';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Verifying Login for "habeebrahmanb" ---');

    // 1. Fetch User
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { username: 'habeebrahmanb' },
                { email: 'habeebrahmanb' } // Simulate user typing username in email field
            ]
        }
    });

    if (!user) {
        console.error('CRITICAL: User NOT found in DB.');
        return;
    }

    console.log(`User found: ID=${user.id}, Username=${user.username}`);
    console.log(`Stored Hash: ${user.password}`);

    // 2. Test Password
    const inputPassword = 'password123';
    console.log(`Testing against password: "${inputPassword}"`);

    try {
        const isMatch = await comparePassword(inputPassword, user.password!);
        console.log(`Result: ${isMatch ? 'SUCCESS (Match)' : 'FAILURE (No Match)'}`);
    } catch (e) {
        console.error('Error during comparison:', e);
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
