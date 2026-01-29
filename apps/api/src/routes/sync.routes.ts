import { Router } from 'express';
import { handleGarminWebhook, handleStravaWebhook } from '../controllers/sync.controller';

const router = Router();

router.post('/garmin', handleGarminWebhook);
router.all('/strava', handleStravaWebhook); // GET for challenge, POST for events

export default router;
