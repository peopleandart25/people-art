-- casting_proposals: 캐스팅 디렉터가 아티스트에게 보내는 제안
CREATE TABLE IF NOT EXISTS casting_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  director_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artist_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  casting_id UUID REFERENCES castings(id) ON DELETE SET NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS casting_proposals_director_idx ON casting_proposals(director_id);
CREATE INDEX IF NOT EXISTS casting_proposals_artist_idx ON casting_proposals(artist_user_id);

-- 중복 제안 방지: casting_id가 있는 경우
CREATE UNIQUE INDEX IF NOT EXISTS casting_proposals_unique_with_casting
  ON casting_proposals(director_id, artist_user_id, casting_id)
  WHERE casting_id IS NOT NULL;

-- 중복 제안 방지: casting_id가 없는 경우
CREATE UNIQUE INDEX IF NOT EXISTS casting_proposals_unique_without_casting
  ON casting_proposals(director_id, artist_user_id)
  WHERE casting_id IS NULL;

-- RLS
ALTER TABLE casting_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "director can manage own proposals" ON casting_proposals
  FOR ALL USING (director_id = auth.uid());

CREATE POLICY "artist can view and update own proposals" ON casting_proposals
  FOR SELECT USING (artist_user_id = auth.uid());

CREATE POLICY "artist can update own proposals" ON casting_proposals
  FOR UPDATE USING (artist_user_id = auth.uid())
  WITH CHECK (artist_user_id = auth.uid());

-- casting_shortlists: 1차 리스트업
CREATE TABLE IF NOT EXISTS casting_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  director_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artist_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  casting_id UUID NOT NULL REFERENCES castings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(director_id, artist_user_id, casting_id)
);

CREATE INDEX IF NOT EXISTS casting_shortlists_casting_idx ON casting_shortlists(casting_id);

ALTER TABLE casting_shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "director can manage shortlists" ON casting_shortlists
  FOR ALL USING (director_id = auth.uid());

-- notifications: 인앱 알림
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user can manage own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());
