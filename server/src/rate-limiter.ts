/**
 * Strava API Rate Limit Tracker
 * 
 * Limits: 300 reads/15min, 3,000 reads/day
 * State is persisted to disk so restarts don't reset counters.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const STATE_FILE = join(process.cwd(), '.rate-limit-state.json');

interface RateLimitState {
    shortWindow: { count: number; resetAt: number };  // 15-min window
    dailyWindow: { count: number; resetAt: number };   // daily window
}

function loadState(): RateLimitState {
    try {
        const data = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
        // Validate loaded state is still relevant (not from a previous day)
        const now = Date.now();
        if (data.dailyWindow?.resetAt && data.dailyWindow.resetAt > now) {
            return data;
        }
    } catch { /* file missing or corrupted, start fresh */ }
    return {
        shortWindow: { count: 0, resetAt: Date.now() + 15 * 60 * 1000 },
        dailyWindow: { count: 0, resetAt: getNextMidnightUTC() },
    };
}

function saveState() {
    try {
        writeFileSync(STATE_FILE, JSON.stringify(state), 'utf-8');
    } catch { /* non-critical, just log */ }
}

const state: RateLimitState = loadState();

function getNextMidnightUTC(): number {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    return tomorrow.getTime();
}

function resetWindowsIfNeeded() {
    const now = Date.now();
    if (now >= state.shortWindow.resetAt) {
        state.shortWindow = { count: 0, resetAt: now + 15 * 60 * 1000 };
    }
    if (now >= state.dailyWindow.resetAt) {
        state.dailyWindow = { count: 0, resetAt: getNextMidnightUTC() };
    }
}

/** Record that we made N Strava API calls */
export function recordCalls(n: number = 1) {
    resetWindowsIfNeeded();
    state.shortWindow.count += n;
    state.dailyWindow.count += n;
    saveState();
}

/** Update limits from Strava response headers (most accurate) */
export function updateFromHeaders(headers: Headers) {
    const usage15 = headers.get('x-readratelimit-usage');
    const limit15 = headers.get('x-readratelimit-limit');

    if (usage15) {
        const [short, daily] = usage15.split(',').map(Number);
        state.shortWindow.count = short;
        state.dailyWindow.count = daily;
        saveState();
    }
}

/** Check if we can make N more calls without exceeding limits */
export function canMakeCalls(n: number = 1): boolean {
    resetWindowsIfNeeded();
    const shortOk = state.shortWindow.count + n <= 280;   // 280/300 (93%) short-term
    const dailyOk = state.dailyWindow.count + n <= 2800;  // 2800/3000 (93%) daily
    return shortOk && dailyOk;
}

/** Get remaining budget */
export function getRemainingBudget(): { short: number; daily: number } {
    resetWindowsIfNeeded();
    return {
        short: Math.max(0, 280 - state.shortWindow.count),
        daily: Math.max(0, 2800 - state.dailyWindow.count),
    };
}

/** Calculate how many users we can sync in this batch */
export function getUserSyncBudget(callsPerUser: number = 2): number {
    const budget = getRemainingBudget();
    const limitedByShort = Math.floor(budget.short / callsPerUser);
    const limitedByDaily = Math.floor(budget.daily / callsPerUser);
    return Math.min(limitedByShort, limitedByDaily);
}

/** Get current usage stats (for logging/monitoring) */
export function getUsageStats(): string {
    resetWindowsIfNeeded();
    return `15min: ${state.shortWindow.count}/280, daily: ${state.dailyWindow.count}/2800`;
}
