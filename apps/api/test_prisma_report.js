const axios = require('axios');

async function testReportDirect() {
    try {
        // Use the actual activity ID from the database
        const activityId = '01920ca7-e438-4edb-9fdb-f2ca049d1023';

        // Simulate being logged in as habeebrahmanb
        // We need to get their token first
        console.log('Testing report submission...');
        console.log('Activity ID:', activityId);

        // For now, let's test without auth to see the error
        const reportPayload = {
            reason: 'Fake Profile/Content',
            details: 'Test report',
            activityId: activityId
        };

        console.log('\nPayload:', JSON.stringify(reportPayload, null, 2));

        try {
            const reportRes = await axios.post('http://localhost:4000/api/reports', reportPayload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('Success:', reportRes.data);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('\n✓ Got expected 401 (auth required)');
                console.log('Now testing with mock token...');

                // The issue is likely in the Prisma create operation
                // Let's check if we can directly test the controller logic
                const { PrismaClient } = require('@prisma/client');
                const prisma = new PrismaClient();

                try {
                    console.log('\nTesting Prisma create directly...');
                    const report = await prisma.violationReport.create({
                        data: {
                            reporterId: '2b9ff2a9-f20f-4afe-8ad8-67d469ebcc28',
                            activityId: activityId,
                            reason: 'Fake Profile/Content',
                            details: 'Test',
                            status: 'PENDING'
                        }
                    });
                    console.log('✓ Prisma create successful!');
                    console.log('Report ID:', report.id);
                } catch (prismaError) {
                    console.error('\n✗ Prisma create failed:');
                    console.error('Error:', prismaError.message);
                    console.error('Code:', prismaError.code);
                } finally {
                    await prisma.$disconnect();
                }
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error('\n✗ Unexpected error:');
        console.error('Status:', error.response?.status);
        console.error('Message:', error.response?.data);
    }
}

testReportDirect();
