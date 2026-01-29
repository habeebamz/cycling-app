import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from './src/utils/auth';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Verifying Auth Flow ---');

    // 1. Check existing user (habeebrahmanb)
    const existing = await prisma.user.findUnique({
        where: { username: 'habeebrahmanb' }
    });

    if (existing) {
        console.log(`User 'habeebrahmanb' exists.`);
        console.log(`Password Hash: ${existing.password}`);

        // Test password match
        if (existing.password) {
            const isMatch = await comparePassword('password', existing.password);
            console.log(`Password 'password' matches? ${isMatch}`);

            if (!isMatch) {
                console.log('WARNING: User exists but password does not match default "password".');
                // Resetting for test purposes if needed? 
                // Better to let the user know.
            }
        } else {
            console.log('User exists but has NO PASSWORD set.');
        }
    } else {
        console.log("User 'habeebrahmanb' NOT found.");
    }

    // 2. Simulate Registration of NEW user
    const newUser = {
        username: 'testuser_reg_' + Date.now(),
        email: `test_reg_${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'Reg'
    };

    console.log(`Attempting to register new user: ${newUser.username}`);

    try {
        const hashedPassword = await hashPassword(newUser.password);
        const created = await prisma.user.create({
            data: {
                ...newUser,
                password: hashedPassword
            }
        });
        console.log('Registration SUCCESS:', created.id);

        // Cleanup
        // await prisma.user.delete({ where: { id: created.id } });
    } catch (e) {
        console.error('Registration FAILED:', e);
    }

    console.log('--- End Verify ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
