import { useStore } from '../store'
import EventTimeline from '../components/EventTimeline'

export default function TimelinePage() {
  const fetchInitial = useStore((s) => s.fetchInitial)

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Timeline de eventos</h1>
        <button
          onClick={() => fetchInitial()}
          className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
        >
          Recargar
        </button>
      </div>
      <EventTimeline limit={200} showAll />
    </div>
  )
}
