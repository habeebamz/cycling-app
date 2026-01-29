
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId }
        });

        if (!user || !['ADMIN', 'MANAGER', 'EDITOR'].includes(user.role)) {
            return res.status(403).json({ error: 'Access denied: Admin privileges required' });
        }

        if (user.status === 'SUSPENDED') {
            return res.status(403).json({ error: 'Access denied: Account Suspended' });
        }

        req.user = { userId: user.id, role: user.role };
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
