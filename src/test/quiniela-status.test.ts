import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getQuinielaState, formatCountdown } from '@/lib/utils/quiniela-status'

// Fecha de referencia fija para todos los tests
const NOW = new Date('2026-06-01T12:00:00Z')

function isoHoursFromNow(hours: number): string {
  return new Date(NOW.getTime() + hours * 3_600_000).toISOString()
}

beforeEach(() => { vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers() })

// ---------------------------------------------------------------------------
// getQuinielaState
// ---------------------------------------------------------------------------

describe('getQuinielaState', () => {
  describe('estado cerrado', () => {
    it('retorna closed cuando la fecha de cierre ya pasó', () => {
      const state = getQuinielaState(isoHoursFromNow(-1))
      expect(state.status).toBe('closed')
      expect(state.isOpen).toBe(false)
      expect(state.canEdit).toBe(false)
      expect(state.hoursRemaining).toBe(0)
      expect(state.secondsRemaining).toBe(0)
    })

    it('retorna closed exactamente en el momento de cierre', () => {
      const state = getQuinielaState(NOW.toISOString())
      expect(state.status).toBe('closed')
      expect(state.isOpen).toBe(false)
    })
  })

  describe('estado closing_soon (≤ 1 hora)', () => {
    it('retorna closing_soon con 30 minutos restantes', () => {
      const state = getQuinielaState(isoHoursFromNow(0.5))
      expect(state.status).toBe('closing_soon')
      expect(state.isOpen).toBe(true)
      expect(state.canEdit).toBe(true)
      expect(state.label).toBe('¡Última llamada!')
    })

    it('retorna closing_soon con exactamente 1 hora restante', () => {
      const state = getQuinielaState(isoHoursFromNow(1))
      expect(state.status).toBe('closing_soon')
    })
  })

  describe('estado warning (1 – 72 horas)', () => {
    it('retorna warning con 24 horas restantes', () => {
      const state = getQuinielaState(isoHoursFromNow(24))
      expect(state.status).toBe('warning')
      expect(state.isOpen).toBe(true)
      expect(state.canEdit).toBe(true)
      expect(state.label).toBe('Próxima a cerrar')
    })

    it('retorna warning con exactamente 72 horas restantes', () => {
      const state = getQuinielaState(isoHoursFromNow(72))
      expect(state.status).toBe('warning')
    })
  })

  describe('estado open (> 72 horas)', () => {
    it('retorna open con 73 horas restantes', () => {
      const state = getQuinielaState(isoHoursFromNow(73))
      expect(state.status).toBe('open')
      expect(state.isOpen).toBe(true)
      expect(state.canEdit).toBe(true)
      expect(state.label).toBe('Abierta')
    })

    it('retorna open con muchos días restantes', () => {
      const state = getQuinielaState(isoHoursFromNow(720))
      expect(state.status).toBe('open')
      expect(state.isOpen).toBe(true)
    })
  })

  describe('apertura manual (isManuallyOpen)', () => {
    it('fuerza estado open aunque la fecha ya pasó', () => {
      const state = getQuinielaState(isoHoursFromNow(-100), true)
      expect(state.status).toBe('open')
      expect(state.isOpen).toBe(true)
      expect(state.canEdit).toBe(true)
      expect(state.label).toBe('Abierta')
    })

    it('fuerza estado open aunque esté en zona warning', () => {
      const state = getQuinielaState(isoHoursFromNow(24), true)
      expect(state.status).toBe('open')
    })
  })

  describe('campos retornados', () => {
    it('incluye closeDate como objeto Date', () => {
      const iso = isoHoursFromNow(100)
      const state = getQuinielaState(iso)
      expect(state.closeDate).toBeInstanceOf(Date)
      expect(state.closeDate.toISOString()).toBe(iso)
    })

    it('hoursRemaining es positivo cuando está abierta', () => {
      const state = getQuinielaState(isoHoursFromNow(50))
      expect(state.hoursRemaining).toBeGreaterThan(0)
    })

    it('secondsRemaining es mayor que hoursRemaining * 3600 - 60', () => {
      const state = getQuinielaState(isoHoursFromNow(10))
      expect(state.secondsRemaining).toBeGreaterThanOrEqual(state.hoursRemaining * 3600)
    })
  })
})

// ---------------------------------------------------------------------------
// formatCountdown
// ---------------------------------------------------------------------------

describe('formatCountdown', () => {
  it('retorna ceros cuando secondsRemaining <= 0', () => {
    expect(formatCountdown(0)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    expect(formatCountdown(-999)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })

  it('descompone correctamente 1 día exacto (86400 s)', () => {
    expect(formatCountdown(86400)).toEqual({ days: 1, hours: 0, minutes: 0, seconds: 0 })
  })

  it('descompone correctamente 1 hora exacta (3600 s)', () => {
    expect(formatCountdown(3600)).toEqual({ days: 0, hours: 1, minutes: 0, seconds: 0 })
  })

  it('descompone correctamente 1 minuto exacto (60 s)', () => {
    expect(formatCountdown(60)).toEqual({ days: 0, hours: 0, minutes: 1, seconds: 0 })
  })

  it('descompone correctamente 1 segundo', () => {
    expect(formatCountdown(1)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 1 })
  })

  it('descompone 2 días, 3 horas, 45 minutos y 30 segundos', () => {
    const total = 2 * 86400 + 3 * 3600 + 45 * 60 + 30
    expect(formatCountdown(total)).toEqual({ days: 2, hours: 3, minutes: 45, seconds: 30 })
  })

  it('todos los valores son enteros no negativos', () => {
    const { days, hours, minutes, seconds } = formatCountdown(99999)
    expect(days).toBeGreaterThanOrEqual(0)
    expect(hours).toBeGreaterThanOrEqual(0)
    expect(minutes).toBeGreaterThanOrEqual(0)
    expect(seconds).toBeGreaterThanOrEqual(0)
    ;[days, hours, minutes, seconds].forEach(v => expect(Number.isInteger(v)).toBe(true))
  })
})
