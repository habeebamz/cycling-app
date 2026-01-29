import { PrismaClient } from '@prisma/client';
import { hashPassword } from './src/utils/auth';

const prisma = new PrismaClient();

async function main() {
    const username = 'habeebrahmanb';
    const newPassword = 'password123';

    console.log(`Resetting password for ${username} to '${newPassword}'...`);

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
        where: { username },
        data: { password: hashedPassword }
    });

    console.log('Password reset successfully.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
