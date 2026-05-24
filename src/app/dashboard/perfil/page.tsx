import Image from 'next/image'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import AvatarEditor from '@/components/perfil/AvatarEditor'
import ChangePasswordForm from '@/components/perfil/ChangePasswordForm'

export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminSupabaseClient()
  const [profileRes, standingRes, recentPicksRes] = await Promise.all([
    admin.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('standings').select('*').eq('user_id', user!.id).single(),
    supabase.from('picks').select(`
      *,
      match:matches(*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*))
    `)
    .eq('user_id', user!.id)
    .eq('match->>is_finished', 'true')
    .order('updated_at', { ascending: false })
    .limit(10),
  ])

  const profile  = profileRes.data
  const standing = standingRes.data

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="font-display text-4xl text-white tracking-wide">Mi Perfil</h1>
        <p className="text-pitch-400">Estadísticas y resultados personales</p>
      </div>

      {/* Tarjeta de perfil */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-pitch-800 flex-shrink-0 ring-2 ring-brand-500/50">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-display text-white">
                {profile?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-display text-3xl text-white">{profile?.username}</h2>
            <p className="text-pitch-400">{profile?.full_name}</p>
            <p className="text-pitch-500 text-xs mt-1">{user?.email}</p>
            {profile?.is_admin && (
              <span className="inline-block mt-2 text-xs bg-brand-900/60 text-brand-300 border border-brand-700 px-2 py-0.5 rounded-full">
                ⚙️ Administrador
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-pitch-800 pt-5">
          <AvatarEditor userId={user!.id} currentAvatar={profile?.avatar_url ?? null} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Posición actual',   value: standing?.rank ? `#${standing.rank}` : '—',   icon: '🏅', color: 'text-yellow-400' },
          { label: 'Puntos totales',    value: standing?.total_points ?? 0,                   icon: '⭐', color: 'text-white' },
          { label: 'Marcadores exactos',value: standing?.exact_scores ?? 0,                   icon: '🎯', color: 'text-pitch-200' },
          { label: 'Resultados correctos', value: standing?.correct_results ?? 0,             icon: '✅', color: 'text-pitch-200' },
        ].map(s => (
          <div key={s.label} className="card p-5 text-center">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className={`font-display text-3xl ${s.color}`}>{s.value}</div>
            <div className="text-pitch-400 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Barra de completado */}
      <div className="card p-5">
        <div className="flex justify-between mb-2">
          <span className="text-white text-sm font-semibold">Quiniela completada</span>
          <span className="text-pitch-300 text-sm">{standing?.completion_pct ?? 0}%</span>
        </div>
        <div className="w-full bg-pitch-800 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-pitch-600 to-brand-500 h-3 rounded-full"
            style={{ width: `${standing?.completion_pct ?? 0}%` }}
          />
        </div>
      </div>

      {/* Cambiar contraseña */}
      <div className="card p-6">
        <h3 className="font-display text-xl text-white mb-4 tracking-wide">🔐 Cambiar contraseña</h3>
        <ChangePasswordForm />
      </div>

      {/* Últimos resultados */}
      <div className="card p-6">
        <h3 className="font-display text-xl text-white mb-4 tracking-wide">Últimos partidos</h3>
        <div className="space-y-3">
          {recentPicksRes.data?.length ? recentPicksRes.data.map((pick: any) => (
            <div key={pick.id} className="flex items-center justify-between bg-pitch-800/40 rounded-xl px-4 py-3">
              <div className="text-sm text-white">
                {pick.match?.home_team?.flag_emoji} {pick.match?.home_team?.short_name}
                {' '}<span className="text-pitch-400 text-xs">vs</span>{' '}
                {pick.match?.away_team?.short_name} {pick.match?.away_team?.flag_emoji}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-pitch-400">Tu pick: {pick.predicted_home}–{pick.predicted_away}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  pick.is_exact
                    ? 'bg-yellow-900/50 text-yellow-300'
                    : pick.is_correct
                    ? 'bg-pitch-700 text-pitch-200'
                    : 'bg-red-950/50 text-red-400'
                }`}>
                  {pick.is_exact ? '🎯' : pick.is_correct ? '✅' : '❌'} {pick.points_earned} pts
                </span>
              </div>
            </div>
          )) : (
            <p className="text-pitch-500 text-center py-4">Aún no hay partidos terminados</p>
          )}
        </div>
      </div>
    </div>
  )
}
