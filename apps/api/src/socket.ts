import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import prisma from './prisma';

export const initSocket = (server: HttpServer) => {
    const io = new Server(server, {
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
