-- H2: Persist webhook events when Strava API rate limit is exhausted.

CREATE TABLE IF NOT EXISTS webhook_backlog (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id bigint NOT NULL,
    object_id bigint NOT NULL,
    aspect_type text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS webhook_backlog_unprocessed_idx
    ON webhook_backlog (created_at)
    WHERE processed_at IS NULL;
