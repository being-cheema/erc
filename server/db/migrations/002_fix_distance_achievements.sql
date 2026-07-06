-- C4: Remove incorrectly unlocked total_distance achievements.
-- profiles.total_distance is stored in meters; achievement seeds are in km.

DELETE FROM user_achievements ua
USING achievements a, profiles p
WHERE ua.achievement_id = a.id
  AND ua.user_id = p.user_id
  AND a.requirement_type = 'total_distance'
  AND p.total_distance / 1000.0 < a.requirement_value;

-- H5: Belt-and-braces backfill for profiles missing member_id
DO $$
DECLARE
  r RECORD;
  new_id TEXT;
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  i INT;
BEGIN
  FOR r IN SELECT user_id FROM profiles WHERE member_id IS NULL LOOP
    new_id := 'ERC';
    FOR i IN 1..13 LOOP
      new_id := new_id || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    UPDATE profiles SET member_id = new_id WHERE user_id = r.user_id;
  END LOOP;
END $$;
