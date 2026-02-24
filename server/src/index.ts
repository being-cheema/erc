import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { generalLimiter, authLimiter } from './middleware/api-rate-limit.js';
import pool from './db.js';

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

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

// Middleware
app.set('trust proxy', 1); // Behind Nginx reverse proxy
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
    origin: [
        'https://api.eroderunnersclub.com',
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

// Strava webhook — outside /functions/ namespace, Strava hits this directly
app.use('/webhook', webhookRouter);

// 404 fallback
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏃 Erode Runners API running on port ${PORT}`);

    // Start scheduled Strava sync (every 6h by default)
    import('./scheduler.js').then(({ startScheduledSync }) => {
        startScheduledSync();
    }).catch(err => {
        console.error('Failed to start scheduled sync:', err);
    });
});

export default app;
