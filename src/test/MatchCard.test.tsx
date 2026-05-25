import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import toast from 'react-hot-toast'
import MatchCard from '@/components/quiniela/MatchCard'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockInsert = vi.fn()
const mockEqFinal = vi.fn()
const mockEqFirst = vi.fn().mockReturnValue({ eq: mockEqFinal })
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqFirst })

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({ insert: mockInsert, update: mockUpdate }),
  }),
}))

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const BASE_MATCH = {
  id: 'match-1',
  match_number: 1,
  stage: 'group',
  group_name: 'A',
  match_date: null,
  venue: null,
  city: null,
  home_score: null,
  away_score: null,
  result: null,
  is_finished: false,
  home_team: { id: 't1', name: 'México',    short_name: 'MEX', flag_emoji: '🇲🇽', group_name: 'A' },
  away_team: { id: 't2', name: 'Argentina', short_name: 'ARG', flag_emoji: '🇦🇷', group_name: 'A' },
  winner: null,
  user_pick: null,
}

const USER_ID = 'user-abc'

beforeEach(() => {
  vi.clearAllMocks()
  mockInsert.mockResolvedValue({ error: null })
  mockEqFinal.mockResolvedValue({ error: null })
})

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

describe('MatchCard — render', () => {
  it('muestra los nombres de los equipos', () => {
    render(<MatchCard match={BASE_MATCH} isEditable userId={USER_ID} />)
    expect(screen.getByText('México')).toBeInTheDocument()
    expect(screen.getByText('Argentina')).toBeInTheDocument()
  })

  it('muestra los tres botones L / E / V', () => {
    render(<MatchCard match={BASE_MATCH} isEditable userId={USER_ID} />)
    expect(screen.getByText('L')).toBeInTheDocument()
    expect(screen.getByText('E')).toBeInTheDocument()
    expect(screen.getByText('V')).toBeInTheDocument()
  })

  it('deshabilita los botones cuando isEditable es false', () => {
    render(<MatchCard match={BASE_MATCH} isEditable={false} userId={USER_ID} />)
    const buttons = screen.getAllByRole('button').filter(b => ['L','E','V'].includes(b.textContent?.trim()[0] ?? ''))
    buttons.forEach(btn => expect(btn).toBeDisabled())
  })

  it('deshabilita los botones cuando el partido terminó', () => {
    render(<MatchCard match={{ ...BASE_MATCH, is_finished: true }} isEditable userId={USER_ID} />)
    const buttons = screen.getAllByRole('button').filter(b => ['L','E','V'].includes(b.textContent?.trim()[0] ?? ''))
    buttons.forEach(btn => expect(btn).toBeDisabled())
  })
})

// ---------------------------------------------------------------------------
// Flujo de guardado
// ---------------------------------------------------------------------------

describe('MatchCard — guardado de picks', () => {
  it('llama a INSERT en el primer guardado (sin pick previo)', async () => {
    render(<MatchCard match={BASE_MATCH} isEditable userId={USER_ID} />)

    fireEvent.click(screen.getByText('L'))
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => expect(mockInsert).toHaveBeenCalledTimes(1))
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('llama a UPDATE si ya existe un pick desde el servidor', async () => {
    const matchWithPick = {
      ...BASE_MATCH,
      user_pick: { predicted_result: 'home' as const },
    }
    render(<MatchCard match={matchWithPick} isEditable userId={USER_ID} />)

    fireEvent.click(screen.getByText('E'))
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('llama a UPDATE en el segundo guardado de la misma sesión (bug: clave duplicada)', async () => {
    render(<MatchCard match={BASE_MATCH} isEditable userId={USER_ID} />)

    // Primer guardado → INSERT
    fireEvent.click(screen.getByText('L'))
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(mockInsert).toHaveBeenCalledTimes(1))

    // Cambiar selección y guardar de nuevo → debe ser UPDATE, no INSERT
    fireEvent.click(screen.getByText('V'))
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
    expect(mockInsert).toHaveBeenCalledTimes(1) // no se llama de nuevo
  })

  it('muestra toast de éxito al guardar', async () => {
    render(<MatchCard match={BASE_MATCH} isEditable userId={USER_ID} />)

    fireEvent.click(screen.getByText('L'))
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('✅ Pick guardado'))
  })

  it('muestra toast de error cuando Supabase devuelve error', async () => {
    mockInsert.mockResolvedValue({ error: { code: '500', message: 'DB error' } })

    render(<MatchCard match={BASE_MATCH} isEditable userId={USER_ID} />)

    fireEvent.click(screen.getByText('L'))
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error: DB error'))
  })

  it('muestra toast de quiniela cerrada en error RLS (42501)', async () => {
    mockInsert.mockResolvedValue({ error: { code: '42501', message: 'permission denied' } })

    render(<MatchCard match={BASE_MATCH} isEditable userId={USER_ID} />)

    fireEvent.click(screen.getByText('E'))
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('🔒 La quiniela está cerrada'))
  })

  it('no llama a INSERT/UPDATE si no hay selección', async () => {
    render(<MatchCard match={BASE_MATCH} isEditable userId={USER_ID} />)

    // No se hace clic en ninguna opción, el botón guardar no debe existir habilitado
    const saveBtn = screen.queryByRole('button', { name: /guardar/i })
    if (saveBtn) {
      fireEvent.click(saveBtn)
      await waitFor(() => {
        expect(mockInsert).not.toHaveBeenCalled()
        expect(mockUpdate).not.toHaveBeenCalled()
      })
    }
  })
})
