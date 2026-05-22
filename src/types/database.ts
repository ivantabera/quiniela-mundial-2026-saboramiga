// Tipos manuales mientras se genera el archivo oficial con: npm run db:types

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      picks: {
        Row: Pick
        Insert: Omit<Pick, 'id' | 'created_at' | 'updated_at' | 'predicted_result' | 'points_earned' | 'is_exact' | 'is_correct'>
        Update: Partial<Omit<Pick, 'id' | 'user_id' | 'match_id'>>
      }
      matches: {
        Row: Match
        Insert: Omit<Match, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Match, 'id'>>
      }
      teams: {
        Row: Team
        Insert: Omit<Team, 'id' | 'created_at'>
        Update: Partial<Omit<Team, 'id'>>
      }
      standings: {
        Row: Standing
        Insert: Omit<Standing, 'id' | 'updated_at'>
        Update: Partial<Omit<Standing, 'id' | 'user_id'>>
      }
      quiniela_config: {
        Row: QuinielaConfig
        Insert: Partial<QuinielaConfig>
        Update: Partial<QuinielaConfig>
      }
      change_logs: {
        Row: ChangeLog
        Insert: Omit<ChangeLog, 'id' | 'created_at'>
        Update: never
      }
      prize_distribution: {
        Row: PrizeDistribution
        Insert: Omit<PrizeDistribution, 'id' | 'calculated_at'>
        Update: never
      }
    }
  }
}

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  is_admin: boolean
  is_active: boolean
  inscription_paid: boolean
  created_at: string
  updated_at: string
}

export interface Pick {
  id: string
  user_id: string
  match_id: string
  predicted_home: number
  predicted_away: number
  predicted_result: 'home' | 'away' | 'draw' | null
  predicted_winner: string | null
  points_earned: number
  is_exact: boolean
  is_correct: boolean
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  match_number: number | null
  stage: 'group' | 'round_of_32' | 'round_of_16' | 'quarters' | 'semis' | 'third_place' | 'final'
  group_name: string | null
  home_team_id: string | null
  away_team_id: string | null
  match_date: string | null
  venue: string | null
  city: string | null
  home_score: number | null
  away_score: number | null
  result: 'home' | 'away' | 'draw' | null
  winner_id: string | null
  is_finished: boolean
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  short_name: string
  group_name: string | null
  flag_emoji: string | null
  flag_url: string | null
  created_at: string
}

export interface Standing {
  id: string
  user_id: string
  total_points: number
  exact_scores: number
  correct_results: number
  matches_played: number
  completion_pct: number
  rank: number | null
  updated_at: string
}

export interface QuinielaConfig {
  id: string
  close_date: string
  is_manually_open: boolean
  pool_amount: number
  currency: string
  scoring_type: string
  tiebreak_enabled: boolean
  tournament_name: string
  tournament_start_date: string
  tournament_end_date: string
  updated_at: string
  updated_by: string | null
}

export interface ChangeLog {
  id: string
  user_id: string | null
  action: string
  table_name: string
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export interface PrizeDistribution {
  id: string
  user_id: string
  rank: number
  total_points: number
  prize_amount: number
  is_winner: boolean
  is_tied: boolean
  calculated_at: string
}

// Tipos extendidos para UI
export interface MatchWithTeams extends Match {
  home_team: Team | null
  away_team: Team | null
  winner: Team | null
  user_pick?: Pick | null
}

export interface StandingWithProfile extends Standing {
  profile: Profile
}

export interface PrizeWithProfile extends PrizeDistribution {
  profile: Profile
}
