import { Router, Request, Response } from 'express';
import { processWebhookEvent, queueWebhookBacklog } from '../services/webhook-processor.js';

const router = Router();

const VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || 'eroderunners_webhook_2025';

// ─── GET /webhook — Subscription validation (one-time setup) ───
router.get('/', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[webhook] Subscription validated');
        return res.json({ 'hub.challenge': challenge });
    }

    return res.sendStatus(403);
});

// ── Deduplication: ignore rapid-fire events for the same activity ──
const recentEvents = new Map<string, number>();
const DEDUP_WINDOW_MS = 10_000;

setInterval(() => {
    const cutoff = Date.now() - DEDUP_WINDOW_MS;
    for (const [key, ts] of recentEvents) {
        if (ts < cutoff) recentEvents.delete(key);
    }
}, 5 * 60 * 1000);

// ─── POST /webhook — Receive events from Strava ───
router.post('/', (req: Request, res: Response) => {
    const event = req.body;

    res.status(200).send('EVENT_RECEIVED');

    if (
        !event ||
        typeof event.object_type !== 'string' ||
        typeof event.aspect_type !== 'string' ||
        typeof event.object_id !== 'number' ||
        typeof event.owner_id !== 'number'
    ) {
        console.warn('[webhook] Ignoring malformed event payload');
        return;
    }

    const dedupeKey = `${event.object_type}:${event.object_id}:${event.aspect_type}`;
    const lastSeen = recentEvents.get(dedupeKey);
    if (lastSeen && Date.now() - lastSeen < DEDUP_WINDOW_MS) {
        console.log(`[webhook] Dedup: skipping duplicate ${String(dedupeKey).replace(/[\n\r\t]/g, '')}`);
        return;
    }
    recentEvents.set(dedupeKey, Date.now());

    processWebhookEvent(event).then(async (ok) => {
        if (!ok) {
            await queueWebhookBacklog(event.owner_id, event.object_id, event.aspect_type);
        }
    }).catch(err => {
        console.error('[webhook] Async processing error:', err);
    });
});

export default router;
