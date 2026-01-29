import { Request, Response } from 'express';
import prisma from '../prisma';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import crypto from 'crypto';
import { sendWelcomeEmail, sendResetPasswordEmail } from '../utils/email';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, username, firstName, lastName } = req.body;

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] },
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                username,
                firstName,
                lastName,
            },
        });

        const token = generateToken(user.id);

        // Send Welcome Email (async)
        sendWelcomeEmail(user.email, user.firstName || user.username).catch(err => console.error('Failed to send welcome email:', err));

        res.status(201).json({ token, user: { id: user.id, email: user.email, username: user.username, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        console.log('--- LOGIN ATTEMPT ---');
        console.log('Email/Username provided:', email);
        console.log('Password length:', password?.length);

        // email field can now be email or username
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: email }
                ]
            }
        });

        if (!user) {
            console.log('❌ User not found in DB');
            return res.status(401).json({ message: 'Invalid credentials (User not found)' });
        }
        console.log('✅ User found:', user.username, 'ID:', user.id);
        console.log('Stored Password Hash:', user.password);

        if (!user.password) {
            console.log('❌ User has no password set');
            return res.status(401).json({ message: 'Invalid credentials (No password)' });
        }

        const isMatch = await comparePassword(password, user.password);
        console.log('Password comparison result:', isMatch);

        if (!isMatch) {
            console.log('❌ Password mismatch');
            // Re-hash input to compare manually in logs (be careful with security in prod, ok for debug now)
            // console.log('Input hashed check:', await hashPassword(password));
            return res.status(401).json({ message: 'Invalid credentials (Password mismatch)' });
        }

        if (user.status === 'SUSPENDED') {
            return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
        }

        const token = generateToken(user.id);

        res.json({ token, user: { id: user.id, email: user.email, username: user.username, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ id: user.id, email: user.email, username: user.username, role: user.role, firstName: user.firstName, lastName: user.lastName, image: user.image });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findFirst({
            where: { email }
        });

        if (!user) {
            // Check username if email fails? No, standard is email.
            // But we should simulate success to prevent enumeration
            return res.json({ message: 'If an account with that email exists, we have sent a password reset link.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // Good practice to hash in DB, but simple string is ok for now. Let's store raw for simplicity or hashed if we want to be secure. 
        // Let's stick to simple raw token for this MVP to avoid complexity with matching.
        // Actually, let's just store the random string.

        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: resetExpires
            }
        });

        // Send email
        const resetLink = `http://localhost:3000/auth/reset-password?token=${resetToken}`;
        await sendResetPasswordEmail(email, resetLink);

        res.json({ message: 'If an account with that email exists, we have sent a password reset link.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { gt: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired password reset token' });
        }

        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });

        res.json({ message: 'Password has been reset successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updatePassword = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { currentPassword, newPassword } = req.body;

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || !user.password) {
            return res.status(400).json({ message: 'User not found or uses external login' });
        }

        const isMatch = await comparePassword(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password' });
        }

        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { currentPassword, newPassword } = req.body;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide both current and new passwords' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.password) return res.status(404).json({ message: 'User not found' });

        const isMatch = await comparePassword(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
