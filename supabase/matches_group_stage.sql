-- ============================================================
-- PARTIDOS FASE DE GRUPOS — Copa Mundial FIFA 2026
-- Fuente: Calendario oficial FIFA (publicado)
-- Horarios: Eastern Daylight Time (EDT = UTC-4) → guardados en UTC
-- Numeración: cronológica por fecha/hora UTC
-- ============================================================
--
-- UPSERT seguro: actualiza datos sin borrar picks existentes.
-- Requiere haber ejecutado teams_48_oficial.sql antes.
-- ============================================================

-- Corregir banderas de subdivisión que Excel no puede renderizar:
-- 🏴󠁧󠁢󠁥󠁮󠁧󠁿 (ENG) y 🏴󠁧󠁢󠁳󠁣󠁴󠁿 (SCO) → 🇬🇧 compatible con todos los sistemas
UPDATE public.teams SET flag_emoji = '🇬🇧' WHERE short_name IN ('ENG', 'SCO');

-- ============================================================
-- 72 PARTIDOS — Grupos A-L
-- ============================================================
WITH team_ids AS (
  SELECT short_name, id FROM public.teams
),
match_data (num, grp, home, away, dt, venue, city) AS (
  VALUES

  -- ── GRUPO A ────────────────────────────────────────────────────────
  -- Jun 11 15:00 ET
  ( 1::int, 'A', 'MEX', 'RSA', '2026-06-11 19:00:00+00'::timestamptz, 'Estadio Ciudad de México',         'Ciudad de México'           ),
  -- Jun 11 22:00 ET
  ( 2,      'A', 'KOR', 'CZE', '2026-06-12 02:00:00+00',              'Estadio Guadalajara',               'Guadalajara'                ),
  -- Jun 18 12:00 ET
  ( 25,     'A', 'CZE', 'RSA', '2026-06-18 16:00:00+00',              'Estadio Atlanta',                   'Atlanta'                    ),
  -- Jun 18 21:00 ET
  ( 28,     'A', 'MEX', 'KOR', '2026-06-19 01:00:00+00',              'Estadio Guadalajara',               'Guadalajara'                ),
  -- Jun 24 21:00 ET
  ( 53,     'A', 'CZE', 'MEX', '2026-06-25 01:00:00+00',              'Estadio Ciudad de México',         'Ciudad de México'           ),
  -- Jun 24 21:00 ET
  ( 54,     'A', 'RSA', 'KOR', '2026-06-25 01:00:00+00',              'Estadio Monterrey',                 'Monterrey'                  ),

  -- ── GRUPO B ────────────────────────────────────────────────────────
  -- Jun 12 15:00 ET
  ( 3,      'B', 'CAN', 'BIH', '2026-06-12 19:00:00+00',              'Estadio Toronto',                   'Toronto'                    ),
  -- Jun 13 15:00 ET
  ( 5,      'B', 'QAT', 'SUI', '2026-06-13 19:00:00+00',              'Estadio Bahía de San Francisco',    'San Francisco Bay Area'     ),
  -- Jun 18 15:00 ET
  ( 26,     'B', 'SUI', 'BIH', '2026-06-18 19:00:00+00',              'Estadio Los Ángeles',               'Los Ángeles'                ),
  -- Jun 18 18:00 ET
  ( 27,     'B', 'CAN', 'QAT', '2026-06-18 22:00:00+00',              'Estadio BC Place Vancouver',        'Vancouver'                  ),
  -- Jun 24 15:00 ET
  ( 49,     'B', 'SUI', 'CAN', '2026-06-24 19:00:00+00',              'Estadio BC Place Vancouver',        'Vancouver'                  ),
  -- Jun 24 15:00 ET
  ( 50,     'B', 'BIH', 'QAT', '2026-06-24 19:00:00+00',              'Estadio Seattle',                   'Seattle'                    ),

  -- ── GRUPO C ────────────────────────────────────────────────────────
  -- Jun 13 18:00 ET
  ( 6,      'C', 'BRA', 'MAR', '2026-06-13 22:00:00+00',              'Estadio Nueva York Nueva Jersey',   'Nueva York / Nueva Jersey'  ),
  -- Jun 13 21:00 ET
  ( 7,      'C', 'HAI', 'SCO', '2026-06-14 01:00:00+00',              'Estadio Boston',                    'Boston'                     ),
  -- Jun 19 18:00 ET
  ( 30,     'C', 'SCO', 'MAR', '2026-06-19 22:00:00+00',              'Estadio Boston',                    'Boston'                     ),
  -- Jun 19 21:00 ET
  ( 31,     'C', 'BRA', 'HAI', '2026-06-20 01:00:00+00',              'Estadio Filadelfia',                'Filadelfia'                 ),
  -- Jun 24 18:00 ET
  ( 51,     'C', 'SCO', 'BRA', '2026-06-24 22:00:00+00',              'Estadio Miami',                     'Miami'                      ),
  -- Jun 24 18:00 ET
  ( 52,     'C', 'MAR', 'HAI', '2026-06-24 22:00:00+00',              'Estadio Atlanta',                   'Atlanta'                    ),

  -- ── GRUPO D ────────────────────────────────────────────────────────
  -- Jun 12 21:00 ET
  ( 4,      'D', 'USA', 'PAR', '2026-06-13 01:00:00+00',              'Estadio Los Ángeles',               'Los Ángeles'                ),
  -- Jun 13 00:00 ET → Jun 14 04:00 UTC
  ( 8,      'D', 'AUS', 'TUR', '2026-06-14 04:00:00+00',              'Estadio BC Place Vancouver',        'Vancouver'                  ),
  -- Jun 19 15:00 ET
  ( 29,     'D', 'USA', 'AUS', '2026-06-19 19:00:00+00',              'Estadio Seattle',                   'Seattle'                    ),
  -- Jun 19 00:00 ET → Jun 20 04:00 UTC
  ( 32,     'D', 'TUR', 'PAR', '2026-06-20 04:00:00+00',              'Estadio Bahía de San Francisco',    'San Francisco Bay Area'     ),
  -- Jun 25 22:00 ET
  ( 59,     'D', 'TUR', 'USA', '2026-06-26 02:00:00+00',              'Estadio Los Ángeles',               'Los Ángeles'                ),
  -- Jun 25 22:00 ET
  ( 60,     'D', 'PAR', 'AUS', '2026-06-26 02:00:00+00',              'Estadio Bahía de San Francisco',    'San Francisco Bay Area'     ),

  -- ── GRUPO E ────────────────────────────────────────────────────────
  -- Jun 14 13:00 ET
  ( 9,      'E', 'GER', 'CUW', '2026-06-14 17:00:00+00',              'Estadio Houston',                   'Houston'                    ),
  -- Jun 14 19:00 ET
  ( 11,     'E', 'CIV', 'ECU', '2026-06-14 23:00:00+00',              'Estadio Filadelfia',                'Filadelfia'                 ),
  -- Jun 20 16:00 ET
  ( 34,     'E', 'GER', 'CIV', '2026-06-20 20:00:00+00',              'Estadio Toronto',                   'Toronto'                    ),
  -- Jun 20 22:00 ET
  ( 35,     'E', 'ECU', 'CUW', '2026-06-21 02:00:00+00',              'Estadio Kansas City',               'Kansas City'                ),
  -- Jun 25 16:00 ET
  ( 55,     'E', 'CUW', 'CIV', '2026-06-25 20:00:00+00',              'Estadio Filadelfia',                'Filadelfia'                 ),
  -- Jun 25 16:00 ET
  ( 56,     'E', 'ECU', 'GER', '2026-06-25 20:00:00+00',              'Estadio Nueva York Nueva Jersey',   'Nueva York / Nueva Jersey'  ),

  -- ── GRUPO F ────────────────────────────────────────────────────────
  -- Jun 14 16:00 ET
  ( 10,     'F', 'NED', 'JPN', '2026-06-14 20:00:00+00',              'Estadio Dallas',                    'Dallas'                     ),
  -- Jun 14 22:00 ET
  ( 12,     'F', 'SWE', 'TUN', '2026-06-15 02:00:00+00',              'Estadio Monterrey',                 'Monterrey'                  ),
  -- Jun 20 13:00 ET
  ( 33,     'F', 'NED', 'SWE', '2026-06-20 17:00:00+00',              'Estadio Houston',                   'Houston'                    ),
  -- Jun 20 00:00 ET → Jun 21 04:00 UTC
  ( 36,     'F', 'TUN', 'JPN', '2026-06-21 04:00:00+00',              'Estadio Monterrey',                 'Monterrey'                  ),
  -- Jun 25 19:00 ET
  ( 57,     'F', 'JPN', 'SWE', '2026-06-25 23:00:00+00',              'Estadio Dallas',                    'Dallas'                     ),
  -- Jun 25 19:00 ET
  ( 58,     'F', 'TUN', 'NED', '2026-06-25 23:00:00+00',              'Estadio Kansas City',               'Kansas City'                ),

  -- ── GRUPO G ────────────────────────────────────────────────────────
  -- Jun 15 15:00 ET
  ( 14,     'G', 'BEL', 'EGY', '2026-06-15 19:00:00+00',              'Estadio Seattle',                   'Seattle'                    ),
  -- Jun 15 21:00 ET
  ( 16,     'G', 'IRN', 'NZL', '2026-06-16 01:00:00+00',              'Estadio Los Ángeles',               'Los Ángeles'                ),
  -- Jun 21 15:00 ET
  ( 38,     'G', 'BEL', 'IRN', '2026-06-21 19:00:00+00',              'Estadio Los Ángeles',               'Los Ángeles'                ),
  -- Jun 21 21:00 ET
  ( 40,     'G', 'NZL', 'EGY', '2026-06-22 01:00:00+00',              'Estadio BC Place Vancouver',        'Vancouver'                  ),
  -- Jun 26 23:00 ET
  ( 65,     'G', 'EGY', 'IRN', '2026-06-27 03:00:00+00',              'Estadio Seattle',                   'Seattle'                    ),
  -- Jun 26 23:00 ET
  ( 66,     'G', 'NZL', 'BEL', '2026-06-27 03:00:00+00',              'Estadio BC Place Vancouver',        'Vancouver'                  ),

  -- ── GRUPO H ────────────────────────────────────────────────────────
  -- Jun 15 12:00 ET
  ( 13,     'H', 'ESP', 'CPV', '2026-06-15 16:00:00+00',              'Estadio Atlanta',                   'Atlanta'                    ),
  -- Jun 15 18:00 ET
  ( 15,     'H', 'KSA', 'URU', '2026-06-15 22:00:00+00',              'Estadio Miami',                     'Miami'                      ),
  -- Jun 21 12:00 ET
  ( 37,     'H', 'ESP', 'KSA', '2026-06-21 16:00:00+00',              'Estadio Atlanta',                   'Atlanta'                    ),
  -- Jun 21 18:00 ET
  ( 39,     'H', 'URU', 'CPV', '2026-06-21 22:00:00+00',              'Estadio Miami',                     'Miami'                      ),
  -- Jun 26 20:00 ET
  ( 63,     'H', 'CPV', 'KSA', '2026-06-27 00:00:00+00',              'Estadio Houston',                   'Houston'                    ),
  -- Jun 26 20:00 ET
  ( 64,     'H', 'URU', 'ESP', '2026-06-27 00:00:00+00',              'Estadio Guadalajara',               'Guadalajara'                ),

  -- ── GRUPO I ────────────────────────────────────────────────────────
  -- Jun 16 15:00 ET
  ( 17,     'I', 'FRA', 'SEN', '2026-06-16 19:00:00+00',              'Estadio Nueva York Nueva Jersey',   'Nueva York / Nueva Jersey'  ),
  -- Jun 16 18:00 ET
  ( 18,     'I', 'IRQ', 'NOR', '2026-06-16 22:00:00+00',              'Estadio Boston',                    'Boston'                     ),
  -- Jun 22 17:00 ET
  ( 42,     'I', 'FRA', 'IRQ', '2026-06-22 21:00:00+00',              'Estadio Filadelfia',                'Filadelfia'                 ),
  -- Jun 22 20:00 ET
  ( 43,     'I', 'NOR', 'SEN', '2026-06-23 00:00:00+00',              'Estadio Nueva York Nueva Jersey',   'Nueva York / Nueva Jersey'  ),
  -- Jun 26 15:00 ET
  ( 61,     'I', 'NOR', 'FRA', '2026-06-26 19:00:00+00',              'Estadio Boston',                    'Boston'                     ),
  -- Jun 26 15:00 ET
  ( 62,     'I', 'SEN', 'IRQ', '2026-06-26 19:00:00+00',              'Estadio Toronto',                   'Toronto'                    ),

  -- ── GRUPO J ────────────────────────────────────────────────────────
  -- Jun 16 21:00 ET
  ( 19,     'J', 'ARG', 'ALG', '2026-06-17 01:00:00+00',              'Estadio Kansas City',               'Kansas City'                ),
  -- Jun 16 00:00 ET → Jun 17 04:00 UTC
  ( 20,     'J', 'AUT', 'JOR', '2026-06-17 04:00:00+00',              'Estadio Bahía de San Francisco',    'San Francisco Bay Area'     ),
  -- Jun 22 13:00 ET
  ( 41,     'J', 'ARG', 'AUT', '2026-06-22 17:00:00+00',              'Estadio Dallas',                    'Dallas'                     ),
  -- Jun 22 23:00 ET
  ( 44,     'J', 'JOR', 'ALG', '2026-06-23 03:00:00+00',              'Estadio Bahía de San Francisco',    'San Francisco Bay Area'     ),
  -- Jun 27 22:00 ET
  ( 71,     'J', 'ALG', 'AUT', '2026-06-28 02:00:00+00',              'Estadio Kansas City',               'Kansas City'                ),
  -- Jun 27 22:00 ET
  ( 72,     'J', 'JOR', 'ARG', '2026-06-28 02:00:00+00',              'Estadio Dallas',                    'Dallas'                     ),

  -- ── GRUPO K ────────────────────────────────────────────────────────
  -- Jun 17 13:00 ET
  ( 21,     'K', 'POR', 'COD', '2026-06-17 17:00:00+00',              'Estadio Houston',                   'Houston'                    ),
  -- Jun 17 22:00 ET
  ( 24,     'K', 'UZB', 'COL', '2026-06-18 02:00:00+00',              'Estadio Ciudad de México',         'Ciudad de México'           ),
  -- Jun 23 13:00 ET
  ( 45,     'K', 'POR', 'UZB', '2026-06-23 17:00:00+00',              'Estadio Houston',                   'Houston'                    ),
  -- Jun 23 22:00 ET
  ( 48,     'K', 'COL', 'COD', '2026-06-24 02:00:00+00',              'Estadio Guadalajara',               'Guadalajara'                ),
  -- Jun 27 19:30 ET
  ( 69,     'K', 'COL', 'POR', '2026-06-27 23:30:00+00',              'Estadio Miami',                     'Miami'                      ),
  -- Jun 27 19:30 ET
  ( 70,     'K', 'COD', 'UZB', '2026-06-27 23:30:00+00',              'Estadio Atlanta',                   'Atlanta'                    ),

  -- ── GRUPO L ────────────────────────────────────────────────────────
  -- Jun 17 16:00 ET  ← ENG (🇬🇧 tras corrección)
  ( 22,     'L', 'ENG', 'CRO', '2026-06-17 20:00:00+00',              'Estadio Dallas',                    'Dallas'                     ),
  -- Jun 17 19:00 ET
  ( 23,     'L', 'GHA', 'PAN', '2026-06-17 23:00:00+00',              'Estadio Toronto',                   'Toronto'                    ),
  -- Jun 23 16:00 ET  ← ENG
  ( 46,     'L', 'ENG', 'GHA', '2026-06-23 20:00:00+00',              'Estadio Boston',                    'Boston'                     ),
  -- Jun 23 19:00 ET
  ( 47,     'L', 'PAN', 'CRO', '2026-06-23 23:00:00+00',              'Estadio Toronto',                   'Toronto'                    ),
  -- Jun 27 17:00 ET  ← ENG (visita)
  ( 67,     'L', 'PAN', 'ENG', '2026-06-27 21:00:00+00',              'Estadio Nueva York Nueva Jersey',   'Nueva York / Nueva Jersey'  ),
  -- Jun 27 17:00 ET
  ( 68,     'L', 'CRO', 'GHA', '2026-06-27 21:00:00+00',              'Estadio Filadelfia',                'Filadelfia'                 )

)
INSERT INTO public.matches (match_number, stage, group_name, home_team_id, away_team_id, match_date, venue, city)
SELECT
  d.num,
  'group',
  d.grp,
  h.id,
  a.id,
  d.dt,
  d.venue,
  d.city
FROM match_data d
JOIN team_ids h ON h.short_name = d.home
JOIN team_ids a ON a.short_name = d.away
ON CONFLICT (match_number) DO UPDATE SET
  stage        = EXCLUDED.stage,
  group_name   = EXCLUDED.group_name,
  home_team_id = EXCLUDED.home_team_id,
  away_team_id = EXCLUDED.away_team_id,
  match_date   = EXCLUDED.match_date,
  venue        = EXCLUDED.venue,
  city         = EXCLUDED.city;

-- ============================================================
-- Verificar: 72 partidos, 6 por grupo (A-L)
-- ============================================================
SELECT
  group_name                                    AS "Grupo",
  COUNT(*)                                      AS "Partidos",
  MIN(match_date) AT TIME ZONE 'America/New_York' AS "Primer partido (ET)",
  MAX(match_date) AT TIME ZONE 'America/New_York' AS "Ultimo partido (ET)"
FROM public.matches
WHERE stage = 'group'
GROUP BY group_name
ORDER BY group_name;
