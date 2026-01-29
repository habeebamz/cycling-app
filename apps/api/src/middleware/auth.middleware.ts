import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import prisma from '../prisma';

export interface AuthRequest extends Request {
    user?: { userId: string; role?: string };
}


export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const decoded = verifyToken(token);

        // Verify user status in DB to ensure not suspended
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { status: true, id: true, role: true } // Fetch minimal fields
        });

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        if (user.status === 'SUSPENDED') {
            return res.status(403).json({ message: 'Access Denied: Account Suspended' });
        }

        req.user = { userId: user.id, role: user.role };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

export const authenticateOptional = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
        try {
            const decoded = verifyToken(token);
            req.user = decoded;
        } catch (error) {
            // Ignore invalid token for optional auth, treat as guest
        }
    }
    next();
};

