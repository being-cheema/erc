import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { generalLimiter, authLimiter } from './middleware/api-rate-limit.js';
import pool from './db.js';
import { assertProductionSecrets } from './utils/boot-checks.js';

assertProductionSecrets();

// Routes
import stravaAuthRouter from './routes/strava-auth.js';
import syncStravaRouter from './routes/sync-strava.js';
import disconnectStravaRouter from './routes/disconnect-strava.js';
import profilesRouter from './routes/profiles.js';
import activitiesRouter from './routes/activities.js';
import leaderboardRouter from './routes/leaderboard.js';
import achievementsRouter from './routes/achievements.js';
import racesRouter from './routes/races.js';
import blogRouter from './routes/blog.js';
import trainingRouter from './routes/training.js';
import adminRouter from './routes/admin.js';
import notificationsRouter from './routes/notifications.js';
import webhookRouter from './routes/webhook.js';
import refreshRouter from './routes/refresh.js';
import authRouter from './routes/auth.js';
import challengesRouter from './routes/challenges.js';
import membersRouter from './routes/members.js';
import groupRunsRouter from './routes/group-runs.js';
import personalRecordsRouter from './routes/personal-records.js';
import clubFeedRouter from './routes/club-feed.js';
import raceResultsRouter from './routes/race-results.js';
import streakCalendarRouter from './routes/streak-calendar.js';
import statsRouter from './routes/stats.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

// Middleware
app.set('trust proxy', 1); // Behind Nginx reverse proxy
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
    origin: [
        'https://api.eroderunnersclub.com',
        'https://app.eroderunnersclub.com',
        'https://eroderunnersclub.com',
        'http://localhost:5173',
        'http://localhost:3000',
    ],
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

// Request logger — minimal in production
if (process.env.NODE_ENV !== 'production') {
    app.use((req, _res, next) => {
        if (req.path !== '/health') {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        }
        next();
    });
}

// Health check
app.get('/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    } catch (err) {
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});

// Edge Function compatible routes (same paths as Supabase)
app.use('/functions/v1/strava-auth', authLimiter, stravaAuthRouter);
app.use('/functions/v1/sync-strava', syncStravaRouter);
app.use('/functions/v1/disconnect-strava', disconnectStravaRouter);
app.use('/api/auth/refresh', authLimiter, refreshRouter);
app.use('/api/auth', authLimiter, authRouter);

// REST API routes
app.use('/api/profiles', profilesRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/achievements', achievementsRouter);
app.use('/api/races', racesRouter);
app.use('/api/blog', blogRouter);
app.use('/api/training', trainingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/members', membersRouter);
app.use('/api/group-runs', groupRunsRouter);
app.use('/api/personal-records', personalRecordsRouter);
app.use('/api/feed', clubFeedRouter);
app.use('/api/race-results', raceResultsRouter);
app.use('/api/streak-calendar', streakCalendarRouter);
app.use('/api/stats', statsRouter);

// Strava webhook — secret path only; legacy /webhook returns 404
app.use('/webhook/:secret', webhookRouter);
app.all('/webhook', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// 404 fallback
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[api] Erode Runners API running on port ${PORT}`);

    // Start scheduled Strava sync (every 24h — safety net for missed webhooks)
    import('./scheduler.js').then(({ startScheduledSync }) => {
        startScheduledSync();
    }).catch(err => {
        console.error('Failed to start scheduled sync:', err);
    });
});

export default app;
