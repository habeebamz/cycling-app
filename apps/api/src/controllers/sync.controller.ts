import { Request, Response } from 'express';
import prisma from '../prisma';

export const handleGarminWebhook = async (req: Request, res: Response) => {
    try {
        // Garmin sends activity data here
        console.log('Received Garmin Webhook:', req.body);

        // TODO: Verify signature
        // TODO: Parse activity data
        // TODO: Create Activity record using prisma.activity.create

        // For now, just acknowledge receipt
        res.status(200).send('OK');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const handleStravaWebhook = async (req: Request, res: Response) => {
    try {
        // Strava verification challenge
        if (req.method === 'GET') {
            const challenge = req.query['hub.challenge'];
            return res.status(200).json({ 'hub.challenge': challenge });
        }

        // Strava event
        console.log('Received Strava Webhook:', req.body);
        res.status(200).send('OK');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
