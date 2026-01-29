const io = require('socket.io-client');

const SOCKET_URL = 'http://localhost:4000';

console.log(`Attempting to connect to ${SOCKET_URL}...`);

const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'], // Try both
    reconnection: false
});

socket.on('connect', () => {
    console.log('SUCCESS: Connected to socket server!');
    console.log('Socket ID:', socket.id);
    socket.close();
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.error('ERROR: Connection failed:', err.message);
    process.exit(1);
});

socket.on('disconnect', () => {
    console.log('Disconnected');
});

// Timeout
setTimeout(() => {
    console.error('TIMEOUT: Could not connect in 5 seconds.');
    socket.close();
    process.exit(1);
}, 5000);
