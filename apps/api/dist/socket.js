"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const initSocket = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "*"], // Explicitly allow frontend and relaxed for dev
            methods: ["GET", "POST"],
            credentials: true
        }
    });
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);
        socket.on('disconnect', () => {
            // console.log('User disconnected');
        });
    });
    return io;
};
exports.initSocket = initSocket;
