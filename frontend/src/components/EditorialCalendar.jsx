import { useEffect, useState } from 'react'
import { api } from '../lib/api'

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export default function EditorialCalendar({ onSelectSujet }) {
  const [items, setItems] = useState([])
  const [nombre, setNombre] = useState(5)
  const [jours, setJours] = useState(7)
  const [theme, setTheme] = useState('')
  const [inclureGithub, setInclureGithub] = useState(true)
  const [inclureActualites, setInclureActualites] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const data = await api.getCalendar()
    setItems(data)
  }

  async function handleSuggest() {
    setLoading(true)
    try {
      await api.suggestTopics({ theme: theme || undefined, nombre, jours, inclureGithub, inclureActualites })
      await load()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Thème (optionnel)
          </label>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="ex: cybersécurité"
            className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 text-xs text-neutral-600">
            <input
              type="checkbox"
              checked={inclureGithub}
              onChange={(e) => setInclureGithub(e.target.checked)}
              className="rounded"
            />
            S'inspirer de mon activité GitHub
          </label>
          <label className="flex items-center gap-1.5 text-xs text-neutral-600">
            <input
              type="checkbox"
              checked={inclureActualites}
              onChange={(e) => setInclureActualites(e.target.checked)}
              className="rounded"
            />
            S'inspirer de l'actualité tech
          </label>
        </div>

        <div className="flex gap-3 items-end">
          <div className="w-24">
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Nombre de posts
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={nombre}
              onChange={(e) => setNombre(Number(e.target.value))}
              className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Sur combien de jours
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={jours}
              onChange={(e) => setJours(Number(e.target.value))}
              className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            onClick={handleSuggest}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded-md h-[34px]"
          >
            {loading ? '…' : 'Suggérer'}
          </button>
        </div>
        {nombre > 0 && jours > 0 && (
          <p className="text-xs text-neutral-400">
            {nombre} post{nombre > 1 ? 's' : ''} réparti{nombre > 1 ? 's' : ''} sur les {jours}{' '}
            prochains jours, à partir de demain.
          </p>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-neutral-200 rounded-lg p-3 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              {item.date_planifiee && (
                <span className="shrink-0 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md capitalize">
                  {formatDate(item.date_planifiee)}
                </span>
              )}
              <span className="text-sm text-neutral-800 truncate">{item.sujet}</span>
            </div>
            <button
              onClick={() => onSelectSujet(item.sujet)}
              className="shrink-0 text-xs text-amber-700 font-medium hover:underline"
            >
              Développer →
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-neutral-400">
            Aucune suggestion pour l'instant — clique sur "Suggérer".
          </p>
        )}
      </div>
    </div>
  )
}
