-- ============================================================
-- EQUIPOS OFICIALES — Mundial 2026 (48 selecciones, 12 grupos)
-- Sorteo: 5 dic 2025, Kennedy Center, Washington D.C.
-- Repechajes completados — todos los equipos confirmados
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Limpiar equipos anteriores
DELETE FROM public.teams;

-- ============================================================
-- 48 EQUIPOS CONFIRMADOS
-- ============================================================
INSERT INTO public.teams (name, short_name, group_name, flag_emoji) VALUES

  -- GRUPO A — Sede: México
  ('México',              'MEX', 'A', '🇲🇽'),
  ('Corea del Sur',       'KOR', 'A', '🇰🇷'),
  ('Sudáfrica',           'RSA', 'A', '🇿🇦'),
  ('República Checa',     'CZE', 'A', '🇨🇿'),

  -- GRUPO B — Sede: Canadá
  ('Canadá',              'CAN', 'B', '🇨🇦'),
  ('Suiza',               'SUI', 'B', '🇨🇭'),
  ('Catar',               'QAT', 'B', '🇶🇦'),
  ('Bosnia y Herz.',      'BIH', 'B', '🇧🇦'),

  -- GRUPO C — Sede: Estados Unidos (Este)
  ('Brasil',              'BRA', 'C', '🇧🇷'),
  ('Marruecos',           'MAR', 'C', '🇲🇦'),
  ('Escocia',             'SCO', 'C', '🏴󠁧󠁢󠁳󠁣󠁴󠁿'),
  ('Haití',               'HAI', 'C', '🇭🇹'),

  -- GRUPO D — Sede: Estados Unidos (Oeste)
  ('Estados Unidos',      'USA', 'D', '🇺🇸'),
  ('Australia',           'AUS', 'D', '🇦🇺'),
  ('Paraguay',            'PAR', 'D', '🇵🇾'),
  ('Turquía',             'TUR', 'D', '🇹🇷'),

  -- GRUPO E — Sede: Estados Unidos (Sur)
  ('Alemania',            'GER', 'E', '🇩🇪'),
  ('Ecuador',             'ECU', 'E', '🇪🇨'),
  ('Costa de Marfil',     'CIV', 'E', '🇨🇮'),
  ('Curazao',             'CUW', 'E', '🇨🇼'),

  -- GRUPO F — Sede: Estados Unidos (Costa Este)
  ('Países Bajos',        'NED', 'F', '🇳🇱'),
  ('Japón',               'JPN', 'F', '🇯🇵'),
  ('Túnez',               'TUN', 'F', '🇹🇳'),
  ('Suecia',              'SWE', 'F', '🇸🇪'),

  -- GRUPO G — Sede: Estados Unidos (Centro)
  ('Bélgica',             'BEL', 'G', '🇧🇪'),
  ('Irán',                'IRN', 'G', '🇮🇷'),
  ('Egipto',              'EGY', 'G', '🇪🇬'),
  ('Nueva Zelanda',       'NZL', 'G', '🇳🇿'),

  -- GRUPO H — Sede: Estados Unidos / México
  ('España',              'ESP', 'H', '🇪🇸'),
  ('Uruguay',             'URU', 'H', '🇺🇾'),
  ('Arabia Saudita',      'KSA', 'H', '🇸🇦'),
  ('Cabo Verde',          'CPV', 'H', '🇨🇻'),

  -- GRUPO I — Sede: Estados Unidos (Noreste)
  ('Francia',             'FRA', 'I', '🇫🇷'),
  ('Senegal',             'SEN', 'I', '🇸🇳'),
  ('Noruega',             'NOR', 'I', '🇳🇴'),
  ('Irak',                'IRQ', 'I', '🇮🇶'),

  -- GRUPO J — Sede: Estados Unidos (Sur)
  ('Argentina',           'ARG', 'J', '🇦🇷'),
  ('Austria',             'AUT', 'J', '🇦🇹'),
  ('Argelia',             'ALG', 'J', '🇩🇿'),
  ('Jordania',            'JOR', 'J', '🇯🇴'),

  -- GRUPO K — Sede: Estados Unidos / Canadá
  ('Portugal',            'POR', 'K', '🇵🇹'),
  ('Colombia',            'COL', 'K', '🇨🇴'),
  ('Uzbekistán',          'UZB', 'K', '🇺🇿'),
  ('Rep. Dem. del Congo', 'COD', 'K', '🇨🇩'),

  -- GRUPO L — Sede: Estados Unidos (Este) / Canadá
  ('Inglaterra',          'ENG', 'L', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'),
  ('Croacia',             'CRO', 'L', '🇭🇷'),
  ('Panamá',              'PAN', 'L', '🇵🇦'),
  ('Ghana',               'GHA', 'L', '🇬🇭');

-- ============================================================
-- Verificar: debe mostrar 12 grupos con 4 equipos cada uno
-- ============================================================
SELECT
  group_name AS "Grupo",
  COUNT(*)   AS "Equipos",
  STRING_AGG(flag_emoji || ' ' || name, ', ' ORDER BY name) AS "Selecciones"
FROM public.teams
GROUP BY group_name
ORDER BY group_name;
