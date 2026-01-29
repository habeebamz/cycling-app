
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const username = 'admin';
    const password = 'AmaniSabiri@#786';
    const email = 'admin@cycletrack.com'; // Use a dedicated admin email

    console.log(`Setting up user '${username}'...`);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists by username
    const existingUser = await prisma.user.findUnique({ where: { username } });

    if (existingUser) {
        console.log('Found existing user. Updating password and role...');
        await prisma.user.update({
            where: { username },
            data: {
                password: hashedPassword,
                role: 'ADMIN'
            }
        });
        console.log('User updated successfully.');
    } else {
        // Check if email exists to avoid unique constraint error
        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
            console.log(`User with email ${email} exists but different username. Updating that user to be admin...`);
            await prisma.user.update({
                where: { email },
                data: {
                    username: 'admin', // Rename to admin
                    password: hashedPassword,
                    role: 'ADMIN'
                }
            });
            console.log('User updated successfully.');
        } else {
            console.log('Creating new admin user...');
            await prisma.user.create({
                data: {
                    username,
                    email,
                    password: hashedPassword,
                    role: 'ADMIN',
                    firstName: 'System',
                    lastName: 'Admin'
                }
            });
            console.log('User created successfully.');
        }
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
