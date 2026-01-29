
import axios from 'axios';

async function main() {
    try {
        console.log('Checking API health at http://127.0.0.1:4000/ ...');
        const res = await axios.get('http://127.0.0.1:4000/');
        console.log('Status:', res.status);
        console.log('Data:', res.data);
        if (res.data === 'Cycling App API is running') {
            console.log('SUCCESS: API is reachable.');
        } else {
            console.log('WARNING: API reachable but returned unexpected response.');
        }
    } catch (error: any) {
        console.error('FAILURE: Could not connect to API.');
        if (error.code === 'ECONNREFUSED') {
            console.error('Connection Refused - Server likely not running on port 4000.');
        } else {
            console.error(error.message);
        }
    }
}

main();
