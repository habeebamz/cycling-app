
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
    const email = 'admin@admin.com'; // Adjust if you know the specific admin email, or find by role
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Try to find existing admin
    let user = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });

    if (user) {
        console.log(`Found admin user: ${user.email} (${user.username})`);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });
        console.log(`Password for ${user.username} reset to: ${password}`);
    } else {
        console.log('No admin found. Creating one...');
        await prisma.user.create({
            data: {
                username: 'admin',
                email: email,
                password: hashedPassword,
                role: 'ADMIN',
                firstName: 'System',
                lastName: 'Admin'
            }
        });
        console.log(`Created new admin: ${email} / ${password}`);
    }

    console.log('Done.');
}

resetAdminPassword()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
