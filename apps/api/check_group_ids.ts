
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const groups = await prisma.group.findMany({
        select: { id: true, name: true, type: true }
    });
    console.log('--- Groups & Clubs IDs ---');
    groups.forEach(g => {
        console.log(`[${g.type}] ${g.name}: ${g.id} (Len: ${g.id.length})`);
    });
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
