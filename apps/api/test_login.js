
const fetch = require('node-fetch');

async function testLogin() {
    console.log('Testing login...');
    try {
        const response = await fetch('http://127.0.0.1:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin',
                password: 'AmaniSabiri@#786'
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Data:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

testLogin();
