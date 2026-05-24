import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from '@/components/shared/StatusBadge'

describe('StatusBadge', () => {
  it('muestra el label recibido', () => {
    render(<StatusBadge status="open" label="Abierta" />)
    expect(screen.getByText('Abierta')).toBeInTheDocument()
  })

  it('muestra cada label para cada status', () => {
    const cases = [
      { status: 'open' as const, label: 'Abierta' },
      { status: 'warning' as const, label: 'Próxima a cerrar' },
      { status: 'closing_soon' as const, label: '¡Última llamada!' },
      { status: 'closed' as const, label: 'Cerrada / Bloqueada' },
    ]
    cases.forEach(({ status, label }) => {
      const { unmount } = render(<StatusBadge status={status} label={label} />)
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    })
  })

  it('aplica clases de tamaño grande con prop large', () => {
    const { container } = render(<StatusBadge status="open" label="Abierta" large />)
    expect(container.firstChild).toHaveClass('text-sm')
  })

  it('el dot no anima cuando está cerrada', () => {
    const { container } = render(<StatusBadge status="closed" label="Cerrada" />)
    const dot = container.querySelector('span > span')
    expect(dot).not.toHaveClass('animate-pulse')
  })

  it('el dot anima cuando está abierta', () => {
    const { container } = render(<StatusBadge status="open" label="Abierta" />)
    const dot = container.querySelector('span > span')
    expect(dot).toHaveClass('animate-pulse')
  })
})
