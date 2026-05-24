-- ============================================================
-- QUINIELA MUNDIAL 2026 — Schema Supabase (PostgreSQL)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: profiles (extiende auth.users de Supabase)
-- ============================================================
CREATE TABLE public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username              TEXT UNIQUE NOT NULL,
  full_name             TEXT,
  avatar_url            TEXT,
  is_admin              BOOLEAN DEFAULT FALSE,
  is_active             BOOLEAN DEFAULT TRUE,
  inscription_paid      BOOLEAN DEFAULT FALSE,
  payment_status        TEXT NOT NULL DEFAULT 'sin_iniciar'
                          CHECK (payment_status IN ('sin_iniciar','pendiente_verificacion','confirmado','rechazado','reembolsado')),
  payment_submitted_at  TIMESTAMPTZ,
  payment_confirmed_at  TIMESTAMPTZ,
  payment_confirmed_by  UUID REFERENCES public.profiles(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: quiniela_config (configuración global del sistema)
-- ============================================================
CREATE TABLE public.quiniela_config (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  close_date            TIMESTAMPTZ NOT NULL DEFAULT '2026-06-10T15:00:00.000Z',
  is_manually_open      BOOLEAN DEFAULT FALSE,
  pool_amount           DECIMAL(10,2) DEFAULT 0.00,
  currency              TEXT DEFAULT 'MXN',
  scoring_type          TEXT DEFAULT 'standard',
  tiebreak_enabled      BOOLEAN DEFAULT TRUE,
  tournament_name       TEXT DEFAULT 'Mundial 2026',
  tournament_start_date TIMESTAMPTZ DEFAULT '2026-06-11T15:00:00.000Z',
  tournament_end_date   TIMESTAMPTZ DEFAULT '2026-07-19T00:00:00.000Z',
  inscription_amount    NUMERIC NOT NULL DEFAULT 100,
  payment_beneficiary   TEXT NOT NULL DEFAULT 'Guillermo Ivan Tabera Bazan',
  payment_bank          TEXT NOT NULL DEFAULT 'BBVA México',
  payment_clabe         TEXT NOT NULL DEFAULT '012180015008419486',
  payment_whatsapp      TEXT NOT NULL DEFAULT '5579321235',
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_by            UUID REFERENCES public.profiles(id)
);

INSERT INTO public.quiniela_config (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ============================================================
-- TABLA: teams
-- ============================================================
CREATE TABLE public.teams (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  short_name TEXT NOT NULL,
  group_name TEXT,
  flag_emoji TEXT,
  flag_url   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: matches
-- ============================================================
CREATE TABLE public.matches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_number    INT UNIQUE,
  stage           TEXT NOT NULL,
  group_name      TEXT,
  home_team_id    UUID REFERENCES public.teams(id),
  away_team_id    UUID REFERENCES public.teams(id),
  match_date      TIMESTAMPTZ,
  venue           TEXT,
  city            TEXT,
  home_score      INT,
  away_score      INT,
  result          TEXT,
  winner_id       UUID REFERENCES public.teams(id),
  is_finished     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: picks
-- ============================================================
CREATE TABLE public.picks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id        UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  predicted_home  INT NOT NULL DEFAULT 0,
  predicted_away  INT NOT NULL DEFAULT 0,
  predicted_result TEXT,
  predicted_winner UUID REFERENCES public.teams(id),
  points_earned   INT DEFAULT 0,
  is_exact        BOOLEAN DEFAULT FALSE,
  is_correct      BOOLEAN DEFAULT FALSE,
  is_official     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- ============================================================
-- TABLA: scoring_rules
-- ============================================================
CREATE TABLE public.scoring_rules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage         TEXT NOT NULL,
  exact_score   INT DEFAULT 3,
  correct_result INT DEFAULT 1,
  correct_winner INT DEFAULT 2,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.scoring_rules (stage, exact_score, correct_result, correct_winner) VALUES
  ('group',    3, 1, 0),
  ('knockout', 3, 0, 2);

-- ============================================================
-- TABLA: standings
-- ============================================================
CREATE TABLE public.standings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_points    INT DEFAULT 0,
  exact_scores    INT DEFAULT 0,
  correct_results INT DEFAULT 0,
  matches_played  INT DEFAULT 0,
  completion_pct  DECIMAL(5,2) DEFAULT 0.00,
  rank            INT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: prize_distribution
-- ============================================================
CREATE TABLE public.prize_distribution (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id),
  rank            INT NOT NULL,
  total_points    INT NOT NULL,
  prize_amount    DECIMAL(10,2) DEFAULT 0.00,
  is_winner       BOOLEAN DEFAULT FALSE,
  is_tied         BOOLEAN DEFAULT FALSE,
  calculated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: prize_claims
-- ============================================================
CREATE TABLE public.prize_claims (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID NOT NULL REFERENCES public.profiles(id),
  full_name                TEXT NOT NULL,
  clabe                    TEXT NOT NULL,
  authorized_instagram_post BOOLEAN DEFAULT FALSE,
  claimed_at               TIMESTAMPTZ DEFAULT NOW(),
  paid_at                  TIMESTAMPTZ,
  transfer_receipt_url     TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- TABLA: change_logs
-- ============================================================
CREATE TABLE public.change_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  table_name   TEXT NOT NULL,
  record_id    UUID,
  old_data     JSONB,
  new_data     JSONB,
  ip_address   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCIONES
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_pick_result(
  p_predicted_home INT,
  p_predicted_away INT
) RETURNS TEXT AS $$
BEGIN
  IF p_predicted_home > p_predicted_away THEN RETURN 'home';
  ELSIF p_predicted_away > p_predicted_home THEN RETURN 'away';
  ELSE RETURN 'draw';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION is_quiniela_open()
RETURNS BOOLEAN AS $$
DECLARE
  config_row quiniela_config%ROWTYPE;
BEGIN
  SELECT * INTO config_row FROM quiniela_config LIMIT 1;
  IF config_row.is_manually_open THEN RETURN TRUE; END IF;
  RETURN NOW() AT TIME ZONE 'UTC' < config_row.close_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_pick_points(p_pick_id UUID)
RETURNS INT AS $$
DECLARE
  pick_row   picks%ROWTYPE;
  match_row  matches%ROWTYPE;
  rule_row   scoring_rules%ROWTYPE;
  points     INT := 0;
BEGIN
  SELECT * INTO pick_row  FROM picks   WHERE id = p_pick_id;
  SELECT * INTO match_row FROM matches WHERE id = pick_row.match_id;
  IF NOT match_row.is_finished THEN RETURN 0; END IF;
  SELECT * INTO rule_row FROM scoring_rules
  WHERE (stage = match_row.stage OR stage = 'all') AND is_active = TRUE
  ORDER BY stage DESC LIMIT 1;
  IF pick_row.predicted_home = match_row.home_score
     AND pick_row.predicted_away = match_row.away_score THEN
    points := rule_row.exact_score;
    UPDATE picks SET is_exact = TRUE, is_correct = TRUE WHERE id = p_pick_id;
  ELSIF pick_row.predicted_result = match_row.result THEN
    points := rule_row.correct_result;
    UPDATE picks SET is_exact = FALSE, is_correct = TRUE WHERE id = p_pick_id;
  ELSIF match_row.stage != 'group' AND pick_row.predicted_winner = match_row.winner_id THEN
    points := rule_row.correct_winner;
    UPDATE picks SET is_exact = FALSE, is_correct = TRUE WHERE id = p_pick_id;
  ELSE
    UPDATE picks SET is_exact = FALSE, is_correct = FALSE WHERE id = p_pick_id;
  END IF;
  UPDATE picks SET points_earned = points, updated_at = NOW() WHERE id = p_pick_id;
  RETURN points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION refresh_standings()
RETURNS VOID AS $$
BEGIN
  INSERT INTO standings (user_id, total_points, exact_scores, correct_results, matches_played, completion_pct)
  SELECT
    p.user_id,
    COALESCE(SUM(p.points_earned), 0),
    COUNT(*) FILTER (WHERE p.is_exact),
    COUNT(*) FILTER (WHERE p.is_correct AND NOT p.is_exact),
    COUNT(*) FILTER (WHERE m.is_finished),
    ROUND((COUNT(p.id)::DECIMAL / NULLIF((SELECT COUNT(*) FROM matches), 0)) * 100, 2)
  FROM picks p
  JOIN matches m ON p.match_id = m.id
  GROUP BY p.user_id
  ON CONFLICT (user_id) DO UPDATE SET
    total_points    = EXCLUDED.total_points,
    exact_scores    = EXCLUDED.exact_scores,
    correct_results = EXCLUDED.correct_results,
    matches_played  = EXCLUDED.matches_played,
    completion_pct  = EXCLUDED.completion_pct,
    updated_at      = NOW();
  WITH ranked AS (
    SELECT user_id, RANK() OVER (ORDER BY total_points DESC) AS r FROM standings
  )
  UPDATE standings s SET rank = r.r FROM ranked r WHERE s.user_id = r.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_prize_distribution()
RETURNS TABLE(user_id UUID, rank INT, total_points INT, prize_amount DECIMAL) AS $$
DECLARE
  pool         DECIMAL;
  winner_count INT;
  prize_each   DECIMAL;
  top_points   INT;
BEGIN
  SELECT pool_amount INTO pool FROM quiniela_config LIMIT 1;

  SELECT MAX(s.total_points) INTO top_points
    FROM standings s
    JOIN profiles p ON s.user_id = p.id
    WHERE p.inscription_paid = true;

  SELECT COUNT(*) INTO winner_count
    FROM standings s
    JOIN profiles p ON s.user_id = p.id
    WHERE s.total_points = top_points AND p.inscription_paid = true;

  prize_each := ROUND(pool / NULLIF(winner_count, 0), 2);

  DELETE FROM prize_distribution;

  INSERT INTO prize_distribution (user_id, rank, total_points, prize_amount, is_winner, is_tied)
  SELECT s.user_id, s.rank, s.total_points,
    CASE WHEN s.total_points = top_points THEN prize_each ELSE 0 END,
    s.total_points = top_points,
    winner_count > 1 AND s.total_points = top_points
  FROM standings s
  JOIN profiles p ON s.user_id = p.id
  WHERE p.inscription_paid = true
  ORDER BY s.rank;

  RETURN QUERY SELECT pd.user_id, pd.rank, pd.total_points, pd.prize_amount
  FROM prize_distribution pd ORDER BY pd.rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION set_predicted_result()
RETURNS TRIGGER AS $$
BEGIN
  NEW.predicted_result := calculate_pick_result(NEW.predicted_home, NEW.predicted_away);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER picks_set_predicted_result
  BEFORE INSERT OR UPDATE ON picks
  FOR EACH ROW EXECUTE FUNCTION set_predicted_result();

CREATE OR REPLACE FUNCTION trigger_refresh_standings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_finished = TRUE AND OLD.is_finished = FALSE THEN
    PERFORM refresh_standings();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER matches_refresh_standings
  AFTER UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_standings();

CREATE OR REPLACE FUNCTION sync_inscription_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'confirmado' THEN
    NEW.inscription_paid := true;
    NEW.payment_confirmed_at := COALESCE(NEW.payment_confirmed_at, NOW());
  ELSIF NEW.payment_status IN ('rechazado', 'reembolsado') THEN
    NEW.inscription_paid := false;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_sync_inscription_paid
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
  EXECUTE FUNCTION sync_inscription_paid();

CREATE OR REPLACE FUNCTION update_pool_amount()
RETURNS TRIGGER AS $$
DECLARE
  v_amount numeric;
  v_count  integer;
BEGIN
  SELECT inscription_amount INTO v_amount FROM quiniela_config LIMIT 1;
  SELECT COUNT(*) INTO v_count FROM profiles WHERE inscription_paid = true;
  UPDATE public.quiniela_config
    SET pool_amount = v_count * v_amount
    WHERE id = '00000000-0000-0000-0000-000000000001';
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Dispara cuando inscription_paid cambia en un UPDATE
CREATE TRIGGER profiles_update_pool_amount
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.inscription_paid IS DISTINCT FROM NEW.inscription_paid)
  EXECUTE FUNCTION update_pool_amount();

-- Dispara cuando se elimina un participante (para restar de la bolsa)
CREATE TRIGGER profiles_update_pool_on_delete
  AFTER DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_pool_amount();

CREATE OR REPLACE FUNCTION archive_unpaid_picks()
RETURNS void AS $$
DECLARE
  archived_count int;
BEGIN
  UPDATE public.picks
    SET is_official = false
    WHERE user_id IN (
      SELECT id FROM public.profiles WHERE payment_status = 'sin_iniciar'
    )
    AND is_official = true;

  GET DIAGNOSTICS archived_count = ROW_COUNT;

  INSERT INTO public.change_logs (action, table_name, new_data)
    VALUES (
      'picks_archived',
      'picks',
      jsonb_build_object('archived_count', archived_count, 'archived_at', NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.picks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiniela_config   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_logs       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "picks_select_own" ON picks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "picks_insert_own" ON picks FOR INSERT WITH CHECK (
  auth.uid() = user_id AND is_quiniela_open()
);
CREATE POLICY "picks_update_own" ON picks FOR UPDATE USING (
  auth.uid() = user_id AND is_quiniela_open()
);

CREATE POLICY "standings_select_all" ON standings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "matches_select_all"   ON matches   FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "teams_select_all"     ON teams     FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "config_select_all"    ON quiniela_config FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "config_update_admin"  ON quiniela_config FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "logs_admin_only"  ON change_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "logs_insert_auth" ON change_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE public.prize_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prize_claims_select_own" ON public.prize_claims
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "prize_claims_insert_own" ON public.prize_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prize_claims_admin_all" ON public.prize_claims
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

GRANT SELECT, INSERT, UPDATE ON public.prize_claims TO authenticated;
GRANT ALL ON public.prize_claims TO service_role;

-- ============================================================
-- EQUIPOS OFICIALES — Mundial 2026 (48 selecciones, 12 grupos)
-- Sorteo: 5 dic 2025, Kennedy Center, Washington D.C.
-- Todos los repechajes confirmados
-- ============================================================
INSERT INTO public.teams (name, short_name, group_name, flag_emoji) VALUES

  -- GRUPO A
  ('México',              'MEX', 'A', '🇲🇽'),
  ('Corea del Sur',       'KOR', 'A', '🇰🇷'),
  ('Sudáfrica',           'RSA', 'A', '🇿🇦'),
  ('República Checa',     'CZE', 'A', '🇨🇿'),

  -- GRUPO B
  ('Canadá',              'CAN', 'B', '🇨🇦'),
  ('Suiza',               'SUI', 'B', '🇨🇭'),
  ('Catar',               'QAT', 'B', '🇶🇦'),
  ('Bosnia y Herz.',      'BIH', 'B', '🇧🇦'),

  -- GRUPO C
  ('Brasil',              'BRA', 'C', '🇧🇷'),
  ('Marruecos',           'MAR', 'C', '🇲🇦'),
  ('Escocia',             'SCO', 'C', '🏴󠁧󠁢󠁳󠁣󠁴󠁿'),
  ('Haití',               'HAI', 'C', '🇭🇹'),

  -- GRUPO D
  ('Estados Unidos',      'USA', 'D', '🇺🇸'),
  ('Australia',           'AUS', 'D', '🇦🇺'),
  ('Paraguay',            'PAR', 'D', '🇵🇾'),
  ('Turquía',             'TUR', 'D', '🇹🇷'),

  -- GRUPO E
  ('Alemania',            'GER', 'E', '🇩🇪'),
  ('Ecuador',             'ECU', 'E', '🇪🇨'),
  ('Costa de Marfil',     'CIV', 'E', '🇨🇮'),
  ('Curazao',             'CUW', 'E', '🇨🇼'),

  -- GRUPO F
  ('Países Bajos',        'NED', 'F', '🇳🇱'),
  ('Japón',               'JPN', 'F', '🇯🇵'),
  ('Túnez',               'TUN', 'F', '🇹🇳'),
  ('Suecia',              'SWE', 'F', '🇸🇪'),

  -- GRUPO G
  ('Bélgica',             'BEL', 'G', '🇧🇪'),
  ('Irán',                'IRN', 'G', '🇮🇷'),
  ('Egipto',              'EGY', 'G', '🇪🇬'),
  ('Nueva Zelanda',       'NZL', 'G', '🇳🇿'),

  -- GRUPO H
  ('España',              'ESP', 'H', '🇪🇸'),
  ('Uruguay',             'URU', 'H', '🇺🇾'),
  ('Arabia Saudita',      'KSA', 'H', '🇸🇦'),
  ('Cabo Verde',          'CPV', 'H', '🇨🇻'),

  -- GRUPO I
  ('Francia',             'FRA', 'I', '🇫🇷'),
  ('Senegal',             'SEN', 'I', '🇸🇳'),
  ('Noruega',             'NOR', 'I', '🇳🇴'),
  ('Irak',                'IRQ', 'I', '🇮🇶'),

  -- GRUPO J
  ('Argentina',           'ARG', 'J', '🇦🇷'),
  ('Austria',             'AUT', 'J', '🇦🇹'),
  ('Argelia',             'ALG', 'J', '🇩🇿'),
  ('Jordania',            'JOR', 'J', '🇯🇴'),

  -- GRUPO K
  ('Portugal',            'POR', 'K', '🇵🇹'),
  ('Colombia',            'COL', 'K', '🇨🇴'),
  ('Uzbekistán',          'UZB', 'K', '🇺🇿'),
  ('Rep. Dem. del Congo', 'COD', 'K', '🇨🇩'),

  -- GRUPO L
  ('Inglaterra',          'ENG', 'L', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'),
  ('Croacia',             'CRO', 'L', '🇭🇷'),
  ('Panamá',              'PAN', 'L', '🇵🇦'),
  ('Ghana',               'GHA', 'L', '🇬🇭');

-- ============================================================
-- Verificación final
-- ============================================================
SELECT
  group_name AS "Grupo",
  COUNT(*)   AS "Equipos",
  STRING_AGG(flag_emoji || ' ' || name, ' · ' ORDER BY name) AS "Selecciones"
FROM public.teams
GROUP BY group_name
ORDER BY group_name;
