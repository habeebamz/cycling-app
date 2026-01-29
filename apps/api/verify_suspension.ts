
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';

async function main() {
    console.log('--- Verifying Suspension Middleware ---');

    console.log('1. Creating test user...');
    const username = 'suspension_test_' + Date.now();
    const user = await prisma.user.create({
        data: {
            username,
            email: username + '@test.com',
            password: 'hashedpassword', // wont log in via api, manually generating token
            role: 'ADMIN',
            status: 'ACTIVE'
        }
    });

    console.log(`   User created: ${user.username} (${user.id})`);

    // Generate valid token
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    console.log('   Token generated.');

    try {
        // 2. Test ACTIVE access (Create Group)
        console.log('2. Testing ACTIVE access (should succeed)...');
        try {
            await axios.post(`${API_URL}/groups`, {
                name: 'Test Group Active',
                type: 'GROUP'
            }, { headers: { Authorization: `Bearer ${token}` } });
            console.log('   ✅ Access granted (expected).');
        } catch (e: any) {
            console.error('   ❌ Access denied (unexpected):', e.response?.data || e.message);
        }

        // 3. Suspend User
        console.log('3. Suspending user...');
        await prisma.user.update({
            where: { id: user.id },
            data: { status: 'SUSPENDED' }
        });
        console.log('   User status set to SUSPENDED.');

        // 4. Test SUSPENDED access (Create Group)
        console.log('4. Testing SUSPENDED access (should fail)...');
        try {
            await axios.post(`${API_URL}/groups`, {
                name: 'Test Group Suspended',
                type: 'GROUP'
            }, { headers: { Authorization: `Bearer ${token}` } });
            console.error('   ❌ Access granted (unexpected! Middleware failed).');
        } catch (e: any) {
            if (e.response?.status === 403) {
                console.log('   ✅ Access denied (expected 403).');
                console.log('   Response:', e.response.data);
            } else {
                console.error(`   ❌ Failed with wrong status ${e.response?.status} (unexpected):`, e.response?.data || e.message);
            }
        }

    } finally {
        // Cleanup
        console.log('5. Cleanup...');
        // Delete groups created by this user to avoid FK error
        await prisma.groupMember.deleteMany({ where: { userId: user.id } });
        await prisma.group.deleteMany({ where: { members: { some: { userId: user.id } } } }); // dependent on how schema is. 
        // Actually Group has members. GroupMember has userId. 
        // If I delete user, GroupMember might cascade?
        // Let's just delete the user and valid cascade should handle it? 
        // P2003 means IT DID NOT cascade.
        // So I must delete related records.
        // Simplified:
        const groups = await prisma.groupMember.findMany({ where: { userId: user.id, role: 'OWNER' }, select: { groupId: true } });
        for (const g of groups) {
            await prisma.post.deleteMany({ where: { groupId: g.groupId } });
            await prisma.groupMember.deleteMany({ where: { groupId: g.groupId } });
            await prisma.group.delete({ where: { id: g.groupId } });
        }

        await prisma.user.delete({ where: { id: user.id } });
        await prisma.$disconnect();
    }
}

main().catch(console.error);
