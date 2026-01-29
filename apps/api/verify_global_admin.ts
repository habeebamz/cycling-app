
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';

async function main() {
    console.log('--- Verifying Global Admin Permissions ---');

    const suffix = Date.now();

    // 1. Create Owner User
    const owner = await prisma.user.create({
        data: { username: `owner_${suffix}`, email: `owner_${suffix}@test.com`, role: 'USER', status: 'ACTIVE' }
    });
    const ownerToken = jwt.sign({ userId: owner.id, role: 'USER' }, JWT_SECRET);

    // 2. Create Admin User
    const admin = await prisma.user.create({
        data: { username: `admin_${suffix}`, email: `admin_${suffix}@test.com`, role: 'ADMIN', status: 'ACTIVE' }
    });
    const adminToken = jwt.sign({ userId: admin.id, role: 'ADMIN' }, JWT_SECRET);

    // 3. Create Group (by Owner)
    // We can use prisma direct to save time, or API. Let's use Prisma to set it up quickly.
    const group = await prisma.group.create({
        data: {
            id: (Math.floor(100000 + Math.random() * 900000)).toString(),
            name: `Group ${suffix}`,
            type: 'GROUP',
            members: { create: { userId: owner.id, role: 'OWNER' } }
        }
    });
    console.log(`Created Group: ${group.name} (${group.id})`);

    // 4. Create Event (by Owner)
    const event = await prisma.event.create({
        data: {
            id: (Math.floor(100000 + Math.random() * 900000)).toString(),
            title: `Event ${suffix}`,
            startTime: new Date(),
            creatorId: owner.id,
            participants: { create: { userId: owner.id, role: 'OWNER', status: 'GOING' } }
        }
    });
    console.log(`Created Event: ${event.title} (${event.id})`);

    try {
        // Test 1: Admin Updates Group (NOT a member)
        console.log('\nTest 1: Admin Updates Group...');
        try {
            await axios.put(`${API_URL}/groups/${group.id}`, {
                name: `Group ${suffix} UPDATED BY ADMIN`
            }, { headers: { Authorization: `Bearer ${adminToken}` } });
            console.log('   ✅ Success (200 OK)');
        } catch (e: any) {
            console.error('   ❌ Failed:', e.response?.data || e.message);
        }

        // Test 2: Admin Creates Post in Group (NOT a member)
        console.log('\nTest 2: Admin Creates Post...');
        try {
            await axios.post(`${API_URL}/groups/posts`, {
                groupId: group.id,
                content: 'Admin post content'
            }, { headers: { Authorization: `Bearer ${adminToken}` } });
            console.log('   ✅ Success (201 Created)');
        } catch (e: any) {
            console.error('   ❌ Failed:', e.response?.data || e.message);
        }

        // Test 3: Admin Updates Event (NOT a participant)
        console.log('\nTest 3: Admin Updates Event...');
        try {
            await axios.put(`${API_URL}/events/${event.id}`, {
                title: `Event ${suffix} UPDATED BY ADMIN`
            }, { headers: { Authorization: `Bearer ${adminToken}` } });
            console.log('   ✅ Success (200 OK)');
        } catch (e: any) {
            console.error('   ❌ Failed:', e.response?.data || e.message);
        }

        // Test 4: Admin Updates Owner Profile
        console.log('\nTest 4: Admin Updates User Profile...');
        try {
            // Note: UpdateUserProfile usually takes target ID from token, 
            // but we added logic to check body.targetUserId
            await axios.put(`${API_URL}/users/profile`, {
                targetUserId: owner.id,
                bio: 'Updated by Admin'
            }, { headers: { Authorization: `Bearer ${adminToken}` } });

            // Verify DB
            const updatedOwner = await prisma.user.findUnique({ where: { id: owner.id } });
            if (updatedOwner?.bio === 'Updated by Admin') {
                console.log('   ✅ Success (Bio updated)');
            } else {
                console.error('   ❌ Failed (Bio match fail):', updatedOwner?.bio);
            }
        } catch (e: any) {
            console.error('   ❌ Failed:', e.response?.data || e.message);
        }

        // Test 5: Verify Group name changed
        const updatedGroup = await prisma.group.findUnique({ where: { id: group.id } });
        if (updatedGroup?.name.includes('UPDATED BY ADMIN')) {
            console.log('\n   ✅ Group Data verified.');
        } else {
            console.error('\n   ❌ Group Data NOT updated.');
        }

    } finally {
        console.log('\nCleanup...');
        await new Promise(r => setTimeout(r, 500)); // allow logs to flush
        // Clean up
        await prisma.notification.deleteMany({ where: { OR: [{ userId: owner.id }, { userId: admin.id }] } });
        await prisma.post.deleteMany({ where: { groupId: group.id } });
        await prisma.eventParticipant.deleteMany({ where: { eventId: event.id } });
        await prisma.event.delete({ where: { id: event.id } });
        await prisma.groupMember.deleteMany({ where: { groupId: group.id } });
        await prisma.group.delete({ where: { id: group.id } });
        await prisma.user.delete({ where: { id: owner.id } });
        await prisma.user.delete({ where: { id: admin.id } });
        await prisma.$disconnect();
    }
}

main().catch(console.error);
