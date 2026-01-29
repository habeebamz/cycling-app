const axios = require('axios');

async function testReportSubmission() {
    try {
        const response = await axios.post('http://localhost:4000/api/reports', {
            reason: 'Test',
            activityId: 'test-activity-id'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response?.status, error.response?.data || error.message);
    }
}

testReportSubmission();
