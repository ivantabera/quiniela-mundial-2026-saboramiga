'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import type { MatchWithTeams } from '@/types/database'

interface Props {
  username: string
  matches: MatchWithTeams[]
  isClosed: boolean
  closeDateFormatted: string
  lastModFormatted: string
  poolAmount: number
  currency: string
}

const PICK_LABEL: Record<string, string> = { home: 'Local', draw: 'Empate', away: 'Visita' }

const KNOCKOUT_ORDER = ['round_of_32', 'round_of_16', 'quarters', 'semis', 'third_place', 'final']
const KNOCKOUT_LABEL: Record<string, string> = {
  round_of_32: 'Ronda de 32',
  round_of_16: 'Octavos de Final',
  quarters:    'Cuartos de Final',
  semis:       'Semifinales',
  third_place: 'Tercer Lugar',
  final:       'Gran Final',
}

function buildSections(matches: MatchWithTeams[]) {
  const sections: { title: string; matches: MatchWithTeams[] }[] = []

  // Grupos ordenados alfabéticamente
  const groupMap = new Map<string, MatchWithTeams[]>()
  for (const m of matches.filter(m => m.stage === 'group')) {
    const k = m.group_name ?? '?'
    if (!groupMap.has(k)) groupMap.set(k, [])
    groupMap.get(k)!.push(m)
  }
  for (const [name, ms] of Array.from(groupMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    sections.push({ title: `Grupo ${name}`, matches: ms })
  }

  // Eliminatorias
  for (const stage of KNOCKOUT_ORDER) {
    const ms = matches.filter(m => m.stage === stage)
    if (ms.length > 0) sections.push({ title: KNOCKOUT_LABEL[stage], matches: ms })
  }

  return sections
}

export default function QuinielaExportButtons({ username, matches, isClosed, closeDateFormatted, lastModFormatted, poolAmount, currency }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const [xlsLoading, setXlsLoading] = useState(false)

  const handlePDFDownload = async () => {
    setPdfLoading(true)
    const toastId = toast.loading('Generando PDF...')
    try {
      const { jsPDF }  = await import('jspdf')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const autoTable  = (await import('jspdf-autotable') as any).default

      // Landscape A4: 297 × 210 mm
      const doc   = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()   // 297
      const pageH = doc.internal.pageSize.getHeight()  // 210
      const mg    = 10

      // ── Header ──────────────────────────────────────────────────
      doc.setFillColor(10, 40, 80)
      doc.rect(0, 0, pageW, 36, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('QUINIELA MUNDIAL 2026', pageW / 2, 12, { align: 'center' })
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Participante: ${username}`, pageW / 2, 20, { align: 'center' })
      doc.setFontSize(8)
      doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, pageW / 2, 27, { align: 'center' })
      doc.text(`Ultima modificacion de picks: ${lastModFormatted}`, pageW / 2, 33, { align: 'center' })

      let y = 42

      // ── Banner de estado ─────────────────────────────────────────
      if (!isClosed) {
        doc.setFillColor(255, 247, 205)
        doc.rect(mg, y, pageW - mg * 2, 18, 'F')
        doc.setDrawColor(200, 150, 0)
        doc.rect(mg, y, pageW - mg * 2, 18, 'D')
        doc.setTextColor(120, 60, 0)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('BORRADOR — Esta NO es la version final', pageW / 2, y + 7, { align: 'center' })
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.text(
          `La version final estara disponible cuando el contador llegue a 0 (${closeDateFormatted})`,
          pageW / 2, y + 14, { align: 'center' }
        )
        y += 25
      } else {
        doc.setFillColor(209, 250, 229)
        doc.rect(mg, y, pageW - mg * 2, 11, 'F')
        doc.setDrawColor(16, 185, 129)
        doc.rect(mg, y, pageW - mg * 2, 11, 'D')
        doc.setTextColor(6, 78, 59)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('VERSION FINAL — Quiniela cerrada', pageW / 2, y + 7.5, { align: 'center' })
        y += 17
      }

      // ── Bolsa acumulada ──────────────────────────────────────────
      const poolFormatted = poolAmount.toLocaleString('es-MX', {
        style: 'currency', currency: currency === 'MXN' ? 'MXN' : 'USD', minimumFractionDigits: 0,
      })
      doc.setFillColor(30, 30, 50)
      doc.rect(mg, y, pageW - mg * 2, 14, 'F')
      doc.setTextColor(250, 210, 80)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`Bolsa acumulada: ${poolFormatted} ${currency}`, pageW / 2, y + 6, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(180, 180, 120)
      const poolNote = isClosed
        ? 'Esta es la bolsa definitiva.'
        : 'Esta bolsa no es definitiva — puede aumentar hasta que el contador llegue a 0.'
      doc.text(poolNote, pageW / 2, y + 11.5, { align: 'center' })
      y += 20

      // ── Leyenda ──────────────────────────────────────────────────
      doc.setFontSize(7)
      doc.setTextColor(120, 120, 120)
      doc.setFont('helvetica', 'italic')
      doc.text('L = Local   E = Empate   V = Visita   — = Sin pick', mg, y)
      y += 6

      // ── Secciones: una tabla por grupo / etapa ───────────────────
      const sections = buildSections(matches)

      for (const section of sections) {
        // Salto de página si no hay espacio suficiente
        if (y > pageH - 35) {
          doc.addPage()
          y = mg + 4
        }

        // Título de sección
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(80, 130, 200)
        doc.text(section.title.toUpperCase(), mg, y)
        y += 3

        // Una fila por partido: Partido | Predicción
        const head = [['#', 'Partido', 'Predicción']]

        const body = section.matches.map(m => {
          const hs = m.home_team?.short_name ?? '?'
          const as_ = m.away_team?.short_name ?? '?'
          const r = m.user_pick?.predicted_result
          const pick = r ? (PICK_LABEL[r] ?? '—') : '—'
          return [
            `#${m.match_number ?? '?'}`,
            `${hs} vs ${as_}`,
            pick,
          ]
        })

        autoTable(doc, {
          startY: y,
          head,
          body,
          theme: 'grid',
          headStyles: {
            fillColor: [10, 40, 80],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center',
            valign: 'middle',
          },
          bodyStyles: {
            fontSize: 8.5,
            valign: 'middle',
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 14 },
            1: { halign: 'left', cellWidth: 70 },
            2: { halign: 'center', fontStyle: 'bold', cellWidth: 30 },
          },
          margin: { left: mg, right: mg },
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = ((doc as any).lastAutoTable?.finalY ?? y) + 7
      }

      // ── Pie de página ────────────────────────────────────────────
      if (y > pageH - 12) {
        doc.addPage()
        y = mg + 4
      }
      doc.setFontSize(7)
      doc.setTextColor(160, 160, 160)
      doc.setFont('helvetica', 'italic')
      doc.text(`Cierre de quiniela: ${closeDateFormatted}`, mg, y + 4)

      const filename = isClosed ? `quiniela-FINAL-${username}.pdf` : `quiniela-borrador-${username}.pdf`
      doc.save(filename)
      toast.success('PDF descargado', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Error al generar el PDF', { id: toastId })
    } finally {
      setPdfLoading(false)
    }
  }

  const handleAllPicksPDF = async () => {
    setXlsLoading(true)
    const toastId = toast.loading('Generando PDF de quinielas...')
    try {
      const res = await fetch('/api/export/spreadsheet')
      if (!res.ok) throw new Error('Error del servidor')
      const { profiles, matches: allMatches, picks, isClosed: allClosed, poolAmount: allPool, poolCurrency, statusText } = await res.json()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { jsPDF } = await import('jspdf')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const autoTable = (await import('jspdf-autotable') as any).default

      const PICK_SHORT: Record<string, string> = { home: 'L', draw: 'E', away: 'V' }

      // picks lookup: userId → matchId → result
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const picksMap = new Map<string, Map<string, string>>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const p of picks as any[]) {
        if (!picksMap.has(p.user_id)) picksMap.set(p.user_id, new Map())
        if (p.predicted_result) picksMap.get(p.user_id)!.set(p.match_id, p.predicted_result)
      }

      const doc   = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const mg    = 10

      // ── Header ──────────────────────────────────────────────────
      doc.setFillColor(10, 40, 80)
      doc.rect(0, 0, pageW, 30, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('QUINIELA MUNDIAL 2026 — Todos los Participantes', pageW / 2, 11, { align: 'center' })
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, pageW / 2, 19, { align: 'center' })
      doc.text(statusText, pageW / 2, 26, { align: 'center' })

      let y = 35

      // ── Bolsa ────────────────────────────────────────────────────
      const poolFmt = (allPool as number).toLocaleString('es-MX', {
        style: 'currency', currency: (poolCurrency as string) === 'MXN' ? 'MXN' : 'USD', minimumFractionDigits: 0,
      })
      doc.setFillColor(30, 30, 50)
      doc.rect(mg, y, pageW - mg * 2, 10, 'F')
      doc.setTextColor(250, 210, 80)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text(
        `Bolsa: ${poolFmt} ${poolCurrency}${allClosed ? ' (definitiva)' : ' (no definitiva — puede aumentar)'}`,
        pageW / 2, y + 7, { align: 'center' }
      )
      y += 15

      // ── Leyenda ──────────────────────────────────────────────────
      doc.setFontSize(7)
      doc.setTextColor(120, 120, 120)
      doc.setFont('helvetica', 'italic')
      doc.text('L = Local   E = Empate   V = Visita   — = Sin pick', mg, y)
      y += 6

      // ── Construir secciones por grupo / etapa ────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type AnyMatch = any
      const sections: { title: string; matches: AnyMatch[] }[] = []
      const groupMap = new Map<string, AnyMatch[]>()
      for (const m of (allMatches as AnyMatch[]).filter(m => m.stage === 'group')) {
        const k = m.group_name ?? '?'
        if (!groupMap.has(k)) groupMap.set(k, [])
        groupMap.get(k)!.push(m)
      }
      for (const [name, ms] of Array.from(groupMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
        sections.push({ title: `Grupo ${name}`, matches: ms })
      }
      for (const stage of KNOCKOUT_ORDER) {
        const ms = (allMatches as AnyMatch[]).filter(m => m.stage === stage)
        if (ms.length > 0) sections.push({ title: KNOCKOUT_LABEL[stage], matches: ms })
      }

      // ── Una tabla por sección ────────────────────────────────────
      for (const section of sections) {
        if (y > pageH - 40) { doc.addPage(); y = mg + 4 }

        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(80, 130, 200)
        doc.text(section.title.toUpperCase(), mg, y)
        y += 3

        const head = [[
          'Participante',
          ...section.matches.map((m: AnyMatch) =>
            `#${m.match_number ?? '?'}\n${m.home_team?.short_name ?? 'TBD'} vs ${m.away_team?.short_name ?? 'TBD'}`
          ),
        ]]

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = (profiles as any[]).map(p => [
          p.username || p.full_name || 'Usuario',
          ...section.matches.map((m: AnyMatch) => {
            const r = picksMap.get(p.id)?.get(m.id)
            return r ? (PICK_SHORT[r] ?? '—') : '—'
          }),
        ])

        autoTable(doc, {
          startY: y,
          head,
          body,
          theme: 'grid',
          headStyles: {
            fillColor: [10, 40, 80],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 7,
            halign: 'center',
            valign: 'middle',
            minCellHeight: 12,
          },
          bodyStyles: { fontSize: 7.5, halign: 'center', valign: 'middle' },
          columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 35 } },
          margin: { left: mg, right: mg },
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = ((doc as any).lastAutoTable?.finalY ?? y) + 7
      }

      const filename = allClosed ? 'quiniela-FINAL-todos.pdf' : 'quiniela-borrador-todos.pdf'
      doc.save(filename)
      toast.success('PDF descargado', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Error al generar el PDF', { id: toastId })
    } finally {
      setXlsLoading(false)
    }
  }

  return (
    <div className={`card p-6 ${
      isClosed
        ? 'border-green-800/50 bg-green-950/10'
        : 'border-amber-800/40 bg-amber-950/10'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-xl text-white tracking-wide mb-1">
            {isClosed ? 'Documentos Finales' : 'Mis Documentos'}
          </h2>
          <p className="text-pitch-400 text-sm">
            {isClosed
              ? 'Descarga la version final de tu quiniela y la hoja comparativa de todos los participantes.'
              : 'Disponibles en todo momento como borrador. La version final se publica cuando el contador llega a 0.'}
          </p>
        </div>
        <span className={`shrink-0 self-start text-xs px-3 py-1.5 rounded-lg font-semibold border ${
          isClosed
            ? 'bg-green-900/40 text-green-400 border-green-700/50'
            : 'bg-amber-900/40 text-amber-400 border-amber-700/50'
        }`}>
          {isClosed ? '✅ Final' : '📋 Borrador'}
        </span>
      </div>

      <div className="text-xs text-pitch-500 mb-5 border-b border-pitch-700/50 pb-4">
        Tus picks — ultima modificacion:{' '}
        <span className="text-pitch-200 font-medium">{lastModFormatted}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handlePDFDownload}
          disabled={pdfLoading}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-pitch-800 hover:bg-pitch-700 border border-pitch-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-base">📄</span>
          {pdfLoading ? 'Generando...' : isClosed ? 'Descargar PDF Final' : 'Descargar PDF (Borrador)'}
        </button>

        <button
          onClick={handleAllPicksPDF}
          disabled={xlsLoading}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-pitch-800 hover:bg-pitch-700 border border-pitch-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-base">📊</span>
          {xlsLoading ? 'Generando...' : isClosed ? 'Ver Quinielas — PDF Final' : 'Ver Quinielas (Borrador PDF)'}
        </button>
      </div>

      {!isClosed && (
        <p className="mt-4 text-xs text-amber-400/60 pt-3 border-t border-pitch-700/40">
          Los documentos de borrador incluyen una leyenda visible indicando que no son la version final.
          La version definitiva se publicara cuando el temporizador llegue a 0.
        </p>
      )}
    </div>
  )
}
