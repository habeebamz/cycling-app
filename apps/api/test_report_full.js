const axios = require('axios');

async function testReportWithAuth() {
    try {
        // First, login to get a token
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:4000/api/auth/login', {
            email: 'admin@cyclingapp.com',
            password: 'admin123'
        });

        const token = loginRes.data.token;
        console.log('✓ Logged in successfully');
        console.log('Token:', token.substring(0, 20) + '...');

        // Get a real activity ID
        console.log('\nFetching activities...');
        const activitiesRes = await axios.get('http://localhost:4000/api/activities', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const activities = activitiesRes.data;
        if (activities.length === 0) {
            console.log('No activities found. Cannot test report.');
            return;
        }

        const activityId = activities[0].id;
        console.log('✓ Found activity:', activityId);

        // Now submit a report
        console.log('\nSubmitting report...');
        const reportPayload = {
            reason: 'Fake Profile/Content',
            details: 'Test report submission',
            activityId: activityId
        };

        console.log('Payload:', JSON.stringify(reportPayload, null, 2));

        const reportRes = await axios.post('http://localhost:4000/api/reports', reportPayload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('\n✓ Report submitted successfully!');
        console.log('Response:', JSON.stringify(reportRes.data, null, 2));

    } catch (error) {
        console.error('\n✗ Error occurred:');
        console.error('Status:', error.response?.status);
        console.error('Message:', error.response?.data?.message);
        console.error('Error details:', error.response?.data?.error);
        console.error('Full response:', JSON.stringify(error.response?.data, null, 2));
    }
}

testReportWithAuth();
