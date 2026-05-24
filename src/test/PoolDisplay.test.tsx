import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PoolDisplay from '@/components/shared/PoolDisplay'

describe('PoolDisplay', () => {
  it('muestra el monto formateado en MXN', () => {
    render(<PoolDisplay amount={5000} currency="MXN" />)
    expect(screen.getByText(/5,000/)).toBeInTheDocument()
    expect(screen.getByText('MXN')).toBeInTheDocument()
  })

  it('muestra el label por defecto', () => {
    render(<PoolDisplay amount={1000} currency="MXN" />)
    expect(screen.getByText('💰 Bolsa acumulada')).toBeInTheDocument()
  })

  it('muestra un label personalizado', () => {
    render(<PoolDisplay amount={1000} currency="MXN" label="✅ Bolsa asegurada" />)
    expect(screen.getByText('✅ Bolsa asegurada')).toBeInTheDocument()
  })

  it('muestra sublabel cuando se pasa', () => {
    render(<PoolDisplay amount={1000} currency="MXN" sublabel="3 participantes confirmados" />)
    expect(screen.getByText('3 participantes confirmados')).toBeInTheDocument()
  })

  it('no muestra sublabel cuando no se pasa', () => {
    render(<PoolDisplay amount={1000} currency="MXN" />)
    expect(screen.queryByText(/participantes/)).not.toBeInTheDocument()
  })

  it('no muestra reparto cuando showReparto es false (default)', () => {
    render(<PoolDisplay amount={4000} currency="MXN" />)
    expect(screen.queryByText('Regla de reparto')).not.toBeInTheDocument()
  })

  it('muestra sección de reparto cuando showReparto es true y amount > 0', () => {
    render(<PoolDisplay amount={4000} currency="MXN" showReparto />)
    expect(screen.getByText('Regla de reparto')).toBeInTheDocument()
  })

  it('no muestra reparto cuando amount es 0 aunque showReparto sea true', () => {
    render(<PoolDisplay amount={0} currency="MXN" showReparto />)
    expect(screen.queryByText('Regla de reparto')).not.toBeInTheDocument()
  })

  it('divide la bolsa en 4 escenarios de ganadores', () => {
    render(<PoolDisplay amount={4000} currency="MXN" showReparto />)
    expect(screen.getByText('1 ganador')).toBeInTheDocument()
    expect(screen.getByText('4 ganadores')).toBeInTheDocument()
  })

  it('muestra badge de empate dividido cuando tiebreakEnabled es true (default)', () => {
    render(<PoolDisplay amount={4000} currency="MXN" showReparto />)
    expect(screen.getByText('⚖️ Empate dividido')).toBeInTheDocument()
  })

  it('muestra badge de un solo ganador cuando tiebreakEnabled es false', () => {
    render(<PoolDisplay amount={4000} currency="MXN" showReparto tiebreakEnabled={false} />)
    expect(screen.getByText('🏆 Un solo ganador')).toBeInTheDocument()
  })
})
