import { differenceInHours, differenceInSeconds } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export type QuinielaStatus = 'open' | 'warning' | 'closing_soon' | 'closed'

export interface QuinielaState {
  status: QuinielaStatus
  isOpen: boolean
  closeDate: Date
  hoursRemaining: number
  secondsRemaining: number
  label: string
  color: string
  canEdit: boolean
}

const TIMEZONE = 'UTC'
const WARNING_HOURS = 72
const CLOSING_SOON_HOURS = 1

export function getQuinielaState(closeDateISO: string, isManuallyOpen = false): QuinielaState {
  const now = new Date()
  const closeDate = new Date(closeDateISO)
  const hoursRemaining = differenceInHours(closeDate, now)
  const secondsRemaining = differenceInSeconds(closeDate, now)

  // Admin forzó apertura manual
  if (isManuallyOpen) {
    return {
      status: 'open',
      isOpen: true,
      closeDate,
      hoursRemaining,
      secondsRemaining,
      label: 'Abierta (Admin)',
      color: 'green',
      canEdit: true,
    }
  }

  if (secondsRemaining <= 0) {
    return {
      status: 'closed',
      isOpen: false,
      closeDate,
      hoursRemaining: 0,
      secondsRemaining: 0,
      label: 'Cerrada / Bloqueada',
      color: 'red',
      canEdit: false,
    }
  }

  if (hoursRemaining <= CLOSING_SOON_HOURS) {
    return {
      status: 'closing_soon',
      isOpen: true,
      closeDate,
      hoursRemaining,
      secondsRemaining,
      label: '¡Última llamada!',
      color: 'red',
      canEdit: true,
    }
  }

  if (hoursRemaining <= WARNING_HOURS) {
    return {
      status: 'warning',
      isOpen: true,
      closeDate,
      hoursRemaining,
      secondsRemaining,
      label: 'Próxima a cerrar',
      color: 'orange',
      canEdit: true,
    }
  }

  return {
    status: 'open',
    isOpen: true,
    closeDate,
    hoursRemaining,
    secondsRemaining,
    label: 'Abierta',
    color: 'green',
    canEdit: true,
  }
}

export function formatCountdown(secondsRemaining: number): {
  days: number
  hours: number
  minutes: number
  seconds: number
} {
  if (secondsRemaining <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }

  const days    = Math.floor(secondsRemaining / 86400)
  const hours   = Math.floor((secondsRemaining % 86400) / 3600)
  const minutes = Math.floor((secondsRemaining % 3600) / 60)
  const seconds = Math.floor(secondsRemaining % 60)

  return { days, hours, minutes, seconds }
}
