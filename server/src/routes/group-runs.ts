import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { requireAuth, isAdminInDb } from '../middleware/auth.js';

const router = Router();

// GET /api/group-runs — list upcoming + recent group runs
router.get('/', requireAuth, async (_req: Request, res: Response) => {
    try {
        const { rows } = await pool.query(
            `SELECT gr.*,
                    (SELECT COUNT(*) FROM group_run_rsvps r WHERE r.group_run_id = gr.id AND r.status = 'going') as going_count,
                    (SELECT COUNT(*) FROM group_run_rsvps r WHERE r.group_run_id = gr.id AND r.status = 'maybe') as maybe_count,
                    (SELECT COUNT(*) FROM group_run_attendance a WHERE a.group_run_id = gr.id) as attended_count,
                    p.display_name as created_by_name
             FROM group_runs gr
             LEFT JOIN profiles p ON p.user_id = gr.created_by
             WHERE gr.is_published = true
             ORDER BY gr.run_date ASC`
        );
        return res.json(rows);
    } catch (err) {
        console.error('[group-runs] List error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/group-runs/:id — single group run with RSVP list
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.user_id;

        const { rows: runRows } = await pool.query(
            `SELECT gr.*,
                    p.display_name as created_by_name
             FROM group_runs gr
             LEFT JOIN profiles p ON p.user_id = gr.created_by
             WHERE gr.id = $1`, [id]
        );
        if (!runRows.length) return res.status(404).json({ error: 'Group run not found' });

        const isAdmin = await isAdminInDb(userId);
        if (!runRows[0].is_published && !isAdmin) {
            return res.status(404).json({ error: 'Group run not found' });
        }

        const { rows: rsvps } = await pool.query(
            `SELECT r.status, r.user_id, p.display_name, p.avatar_url, p.member_id
             FROM group_run_rsvps r
             JOIN profiles p ON p.user_id = r.user_id
             WHERE r.group_run_id = $1
             ORDER BY r.created_at ASC`, [id]
        );

        const { rows: attendance } = await pool.query(
            `SELECT a.user_id, a.checked_in_at, p.display_name, p.avatar_url, p.member_id
             FROM group_run_attendance a
             JOIN profiles p ON p.user_id = a.user_id
             WHERE a.group_run_id = $1
             ORDER BY a.checked_in_at ASC`, [id]
        );

        const myRsvp = rsvps.find((r: any) => r.user_id === userId);
        const myAttendance = attendance.find((a: any) => a.user_id === userId);

        return res.json({
            ...runRows[0],
            rsvps,
            attendance,
            my_rsvp: myRsvp?.status || null,
            my_attended: !!myAttendance,
        });
    } catch (err) {
        console.error('[group-runs] Detail error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/group-runs/:id/rsvp — RSVP to a group run
router.post('/:id/rsvp', requireAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.user_id;
        const { status } = req.body;

        if (!['going', 'maybe', 'not_going'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        if (status === 'going') {
            const { rows: runRows } = await pool.query(
                'SELECT max_participants FROM group_runs WHERE id = $1 AND is_published = true',
                [id]
            );
            if (!runRows.length) {
                return res.status(404).json({ error: 'Group run not found' });
            }

            const maxParticipants = runRows[0].max_participants;
            if (maxParticipants != null) {
                const { rows: countRows } = await pool.query(
                    `SELECT COUNT(*)::int AS count
                     FROM group_run_rsvps
                     WHERE group_run_id = $1 AND status = 'going' AND user_id != $2`,
                    [id, userId]
                );
                if (countRows[0].count >= maxParticipants) {
                    return res.status(409).json({ error: 'This run is full' });
                }
            }
        }

        if (status === 'not_going') {
            await pool.query(
                'DELETE FROM group_run_rsvps WHERE group_run_id = $1 AND user_id = $2',
                [id, userId]
            );
        } else {
            await pool.query(
                `INSERT INTO group_run_rsvps (group_run_id, user_id, status)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (group_run_id, user_id) DO UPDATE SET status = $3`,
                [id, userId, status]
            );
        }

        return res.json({ success: true });
    } catch (err) {
        console.error('[group-runs] RSVP error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/group-runs/:id/checkin — mark attendance (admin or self via QR)
function isSameDayIST(dateA: Date, dateB: Date): boolean {
    const fmt = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return fmt(dateA) === fmt(dateB);
}

router.post('/:id/checkin', requireAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const checkedInBy = req.user!.user_id;
        const requestedTargetUserId = req.body.user_id;
        const targetUserId = requestedTargetUserId || checkedInBy;
        const isAdmin = await isAdminInDb(checkedInBy);

        if (requestedTargetUserId && requestedTargetUserId !== checkedInBy && !isAdmin) {
            return res.status(403).json({ error: 'Only admins can check in other users' });
        }

        const { rows: runRows } = await pool.query(
            'SELECT run_date FROM group_runs WHERE id = $1',
            [id]
        );
        if (!runRows.length) {
            return res.status(404).json({ error: 'Group run not found' });
        }

        if (!isAdmin && !isSameDayIST(new Date(runRows[0].run_date), new Date())) {
            return res.status(400).json({ error: 'Check-in is only available on the day of the run' });
        }

        await pool.query(
            `INSERT INTO group_run_attendance (group_run_id, user_id, checked_in_by)
             VALUES ($1, $2, $3)
             ON CONFLICT (group_run_id, user_id) DO NOTHING`,
            [id, targetUserId, checkedInBy]
        );

        return res.json({ success: true });
    } catch (err) {
        console.error('[group-runs] Checkin error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
