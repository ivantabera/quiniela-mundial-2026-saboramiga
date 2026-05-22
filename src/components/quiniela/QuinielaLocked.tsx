export default function QuinielaLocked() {
  return (
    <div className="card border-red-800/50 bg-red-950/20 p-8 text-center">
      <div className="text-6xl mb-4">🔒</div>
      <h3 className="font-display text-3xl text-red-300 tracking-wide mb-2">
        QUINIELA CERRADA
      </h3>
      <p className="text-red-400/80 max-w-md mx-auto">
        La quiniela está bloqueada. Solo puedes consultar tus predicciones guardadas,
        el ranking y las estadísticas. ¡Buena suerte!
      </p>
    </div>
  )
}
