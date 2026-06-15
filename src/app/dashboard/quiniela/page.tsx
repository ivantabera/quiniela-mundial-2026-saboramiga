import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server'
import { getQuinielaState, isMatchOpen } from '@/lib/utils/quiniela-status'
import QuinielaLocked from '@/components/quiniela/QuinielaLocked'
import QuinielaExportButtons from '@/components/quiniela/QuinielaExportButtons'
import QuinielaMatchList from '@/components/quiniela/QuinielaMatchList'
import PaymentStatusBanner from '@/components/shared/PaymentStatusBanner'
import type { MatchWithTeams } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function QuinielaPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminSupabaseClient()

  const [configRes, matchesRes, profileRes] = await Promise.all([
    supabase.from('quiniela_config').select('*').single(),
    supabase
      .from('matches')
      .select(`
        *,
        home_team:home_team_id(id, name, short_name, flag_emoji, group_name),
        away_team:away_team_id(id, name, short_name, flag_emoji, group_name),
        winner:winner_id(id, name, short_name, flag_emoji, group_name)
      `)
      .order('match_date', { ascending: true }),
    admin.from('profiles').select('username, full_name, payment_status, inscription_paid').eq('id', user!.id).single(),
  ])

  const config        = configRes.data
  const state         = config ? getQuinielaState(config.close_date, config.is_manually_open) : null
  const openMatches   = (matchesRes.data ?? []).filter(m => !m.is_finished && isMatchOpen(m.match_date, config))
  const anyMatchOpen  = openMatches.length > 0
  const username       = profileRes.data?.username || profileRes.data?.full_name || 'usuario'
  const paymentStatus  = profileRes.data?.payment_status ?? 'sin_iniciar'
  const inscriptionPaid = profileRes.data?.inscription_paid ?? false

  // Obtener picks del usuario
  const { data: userPicks } = await supabase
    .from('picks')
    .select('*')
    .eq('user_id', user!.id)

  const picksMap = new Map(userPicks?.map(p => [p.match_id, p]) ?? [])

  const lastModified = userPicks && userPicks.length > 0
    ? userPicks.reduce((max, p) => p.updated_at > max ? p.updated_at : max, userPicks[0].updated_at)
    : null

  // Combinar picks con partidos
  const matchesWithPicks: MatchWithTeams[] = (matchesRes.data ?? []).map(m => ({
    ...m,
    user_pick: picksMap.get(m.id) ?? null,
  }))

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-white tracking-wide">Mi Quiniela</h1>
          <p className="text-pitch-400">
            {anyMatchOpen ? `${openMatches.length} partido${openMatches.length !== 1 ? 's' : ''} aún abierto${openMatches.length !== 1 ? 's' : ''}` : 'Quiniela cerrada — solo lectura'}
          </p>
        </div>
        {config && (
          <div className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
            anyMatchOpen
              ? 'bg-pitch-800 text-pitch-200 border-pitch-600'
              : 'bg-red-950/50 text-red-300 border-red-700'
          }`}>
            {anyMatchOpen ? `⏳ ${openMatches.length} abierto${openMatches.length !== 1 ? 's' : ''}` : '🔒 Cerrada'}
          </div>
        )}
      </div>

      {config && (() => {
        const dateFmt = { day: '2-digit' as const, month: 'long' as const, year: 'numeric' as const, hour: '2-digit' as const, minute: '2-digit' as const }
        const closeDateFormatted = new Date(config.close_date).toLocaleString('es-MX', dateFmt)
        const lastModFormatted = lastModified
          ? new Date(lastModified).toLocaleString('es-MX', dateFmt)
          : 'Sin modificaciones aun'
        return (
          <QuinielaExportButtons
            username={username}
            matches={matchesWithPicks}
            isClosed={!state?.isOpen}
            closeDateFormatted={closeDateFormatted}
            lastModFormatted={lastModFormatted}
            poolAmount={config.pool_amount}
            currency={config.currency}
          />
        )
      })()}

      {!anyMatchOpen && <QuinielaLocked />}

      {!inscriptionPaid ? (
        <div className="card p-8 text-center space-y-3">
          <div className="text-4xl">🔒</div>
          <h2 className="font-display text-2xl text-white">Acceso restringido</h2>
          <p className="text-pitch-400 max-w-sm mx-auto text-sm">
            Solo los participantes con pago confirmado pueden ver y editar sus picks.
            Completa tu pago para unirte a la competencia.
          </p>
          <a href="/dashboard/pago"
            className="inline-block mt-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors">
            Ver instrucciones de pago →
          </a>
        </div>
      ) : (
        <QuinielaMatchList
          matches={matchesWithPicks}
          config={config}
          userId={user!.id}
        />
      )}

      {/* Banner de pago al fondo — visible mientras la quiniela esté abierta */}
      {anyMatchOpen && (
        <PaymentStatusBanner paymentStatus={paymentStatus} />
      )}
    </div>
  )
}
