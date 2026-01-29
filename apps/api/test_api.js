
const axios = require('axios');

async function test() {
    try {
        console.log('Testing /api/users...');
        const users = await axios.get('http://localhost:4000/api/users');
        console.log('Users count:', users.data.length);

        console.log('\nTesting /api/groups...');
        const groups = await axios.get('http://localhost:4000/api/groups');
        console.log('Groups count:', groups.data.length);
    } catch (e) {
        console.error('API Test failed:', e.message);
    }
}

test();
