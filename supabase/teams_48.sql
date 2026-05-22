-- ============================================================
-- ACTUALIZAR EQUIPOS — Mundial 2026 (48 selecciones, 12 grupos)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Limpiar equipos anteriores
DELETE FROM public.teams;

-- Insertar los 48 equipos del Mundial 2026
INSERT INTO public.teams (name, short_name, group_name, flag_emoji) VALUES

  -- GRUPO A
  ('Estados Unidos',    'USA', 'A', '🇺🇸'),
  ('Panamá',            'PAN', 'A', '🇵🇦'),
  ('Honduras',          'HON', 'A', '🇭🇳'),
  ('Serbia',            'SRB', 'A', '🇷🇸'),

  -- GRUPO B
  ('México',            'MEX', 'B', '🇲🇽'),
  ('Ecuador',           'ECU', 'B', '🇪🇨'),
  ('Jamaica',           'JAM', 'B', '🇯🇲'),
  ('Venezuela',         'VEN', 'B', '🇻🇪'),

  -- GRUPO C
  ('Canadá',            'CAN', 'C', '🇨🇦'),
  ('Marruecos',         'MAR', 'C', '🇲🇦'),
  ('Croacia',           'CRO', 'C', '🇭🇷'),
  ('Bélgica',           'BEL', 'C', '🇧🇪'),

  -- GRUPO D
  ('Brasil',            'BRA', 'D', '🇧🇷'),
  ('Japón',             'JPN', 'D', '🇯🇵'),
  ('Grupo D - Equipo 3','GD3', 'D', '🌍'),
  ('Grupo D - Equipo 4','GD4', 'D', '🌍'),

  -- GRUPO E
  ('Alemania',          'GER', 'E', '🇩🇪'),
  ('España',            'ESP', 'E', '🇪🇸'),
  ('Grupo E - Equipo 3','GE3', 'E', '🌍'),
  ('Grupo E - Equipo 4','GE4', 'E', '🌍'),

  -- GRUPO F
  ('Argentina',         'ARG', 'F', '🇦🇷'),
  ('Australia',         'AUS', 'F', '🇦🇺'),
  ('Grupo F - Equipo 3','GF3', 'F', '🌍'),
  ('Grupo F - Equipo 4','GF4', 'F', '🌍'),

  -- GRUPO G
  ('Francia',           'FRA', 'G', '🇫🇷'),
  ('Portugal',          'POR', 'G', '🇵🇹'),
  ('Grupo G - Equipo 3','GG3', 'G', '🌍'),
  ('Grupo G - Equipo 4','GG4', 'G', '🌍'),

  -- GRUPO H
  ('Uruguay',           'URU', 'H', '🇺🇾'),
  ('Corea del Sur',     'KOR', 'H', '🇰🇷'),
  ('Grupo H - Equipo 3','GH3', 'H', '🌍'),
  ('Grupo H - Equipo 4','GH4', 'H', '🌍'),

  -- GRUPO I
  ('Países Bajos',      'NED', 'I', '🇳🇱'),
  ('Irán',              'IRN', 'I', '🇮🇷'),
  ('Grupo I - Equipo 3','GI3', 'I', '🌍'),
  ('Grupo I - Equipo 4','GI4', 'I', '🌍'),

  -- GRUPO J
  ('Inglaterra',        'ENG', 'J', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'),
  ('Senegal',           'SEN', 'J', '🇸🇳'),
  ('Grupo J - Equipo 3','GJ3', 'J', '🌍'),
  ('Grupo J - Equipo 4','GJ4', 'J', '🌍'),

  -- GRUPO K
  ('Colombia',          'COL', 'K', '🇨🇴'),
  ('Grupo K - Equipo 2','GK2', 'K', '🌍'),
  ('Grupo K - Equipo 3','GK3', 'K', '🌍'),
  ('Grupo K - Equipo 4','GK4', 'K', '🌍'),

  -- GRUPO L
  ('Turquía',           'TUR', 'L', '🇹🇷'),
  ('Grupo L - Equipo 2','GL2', 'L', '🌍'),
  ('Grupo L - Equipo 3','GL3', 'L', '🌍'),
  ('Grupo L - Equipo 4','GL4', 'L', '🌍');

-- Verificar
SELECT group_name, COUNT(*) as equipos
FROM public.teams
GROUP BY group_name
ORDER BY group_name;
