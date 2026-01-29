import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { initSocket } from './socket';

import authRoutes from './routes/auth.routes';
import activityRoutes from './routes/activity.routes';
import syncRoutes from './routes/sync.routes';
import userRoutes from './routes/user.routes';
import communityRoutes from './routes/community.routes';
import challengeRoutes from './routes/challenge.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';
import reportRoutes from './routes/report.routes';

import { checkAndCreateMonthlyChallenges } from './services/challenge.scheduler';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Scheduler
const runStartupChecks = async () => {
  const now = new Date();
  await checkAndCreateMonthlyChallenges(now);

  // Also check if we should create next month (5 days before)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  if (daysInMonth - now.getDate() <= 5) {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await checkAndCreateMonthlyChallenges(nextMonth);
  }
};
runStartupChecks().catch(console.error);

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = initSocket(server);

// Make io accessible in routes if needed (e.g. app.set('io', io))
app.set('io', io);

app.use(cors());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/users', userRoutes);
app.use('/api', communityRoutes); // Mount at /api root for groups
app.use('/api/challenges', challengeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.send('Cycling App API is running');
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
