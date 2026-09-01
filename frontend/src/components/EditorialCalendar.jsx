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

function formatMonthYear(date) {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function getMonthGrid(year, month) {
  // Lundi = 0 ... Dimanche = 6
  const firstDay = new Date(year, month, 1)
  const jsDay = firstDay.getDay() // 0 Dimanche
  const firstWeekday = jsDay === 0 ? 6 : jsDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells = []
  // previous month filler
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, daysInPrevMonth - i),
    })
  }
  // current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isCurrentMonth: true, date: new Date(year, month, d) })
  }
  // next month filler to complete 6 weeks (42 cells) or 5 weeks (35) - we target 35 if enough, else 42
  const target = cells.length <= 35 ? 35 : 42
  let nextDay = 1
  while (cells.length < target) {
    cells.push({ day: nextDay, isCurrentMonth: false, date: new Date(year, month + 1, nextDay) })
    nextDay++
  }
  return cells
}

export default function EditorialCalendar({ onSelectSujet }) {
  const [items, setItems] = useState([])
  const [nombre, setNombre] = useState(5)
  const [jours, setJours] = useState(7)
  const [theme, setTheme] = useState('')
  const [inclureGithub, setInclureGithub] = useState(true)
  const [inclureActualites, setInclureActualites] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [view, setView] = useState('list') // 'list' | 'month'
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  useEffect(() => {
    const savedGithub = localStorage.getItem('kora_github_enabled')
    const savedTech = localStorage.getItem('kora_tech_enabled')
    if (savedGithub !== null) setInclureGithub(savedGithub === 'true')
    if (savedTech !== null) setInclureActualites(savedTech === 'true')
    load()
  }, [])

  async function load() {
    try {
      const data = await api.getCalendar()
      setItems(data)
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleSuggest() {
    setLoading(true)
    setError(null)
    try {
      await api.suggestTopics({ theme: theme || undefined, nombre, jours, inclureGithub, inclureActualites })
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Map date string YYYY-MM-DD to items for month view
  const itemsByDate = {}
  items.forEach((item) => {
    if (!item.date_planifiee) return
    const key = item.date_planifiee // already YYYY-MM-DD
    if (!itemsByDate[key]) itemsByDate[key] = []
    itemsByDate[key].push(item)
  })

  const monthGrid = getMonthGrid(currentMonth.getFullYear(), currentMonth.getMonth())
  const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-display-lg font-display-lg text-primary">
            {view === 'month' ? formatMonthYear(currentMonth) : 'Calendrier Éditorial'}
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">
            {view === 'month' ? 'Planification éditoriale et suggestions Kora' : 'Planifiez et générez votre contenu sur la durée.'}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-surface p-1 rounded-lg border border-surface-border shadow-sm">
          <button
            onClick={() => setView('month')}
            className={`px-4 py-2 rounded-md font-label-md text-label-md transition-colors ${view === 'month' ? 'bg-primary-container text-on-primary-container shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
          >
            Vue Mois
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-md font-label-md text-label-md transition-colors ${view === 'list' ? 'bg-white border border-surface-border shadow-sm font-bold' : 'text-on-surface-variant hover:text-primary'}`}
          >
            Vue Liste
          </button>
        </div>
      </header>

      {error && <p className="text-sm text-error-red bg-error-container px-4 py-2 rounded-lg">{error}</p>}

      {view === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Config */}
          <section className="lg:col-span-4 flex flex-col">
            <div className="bg-surface rounded-xl p-6 border border-surface-border shadow-[0_4px_12px_rgba(15,23,42,0.02)]">
              <h3 className="text-headline-sm font-headline-sm text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tune</span> Configuration
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-2">Thème Principal</label>
                  <input
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="Ex: Tendances IA 2024"
                    className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-4 py-3 text-body-md font-body-md focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors placeholder:text-outline"
                  />
                </div>

                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-3">Sources d'inspiration</label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border border-surface-border rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors has-[input:checked]:border-secondary has-[input:checked]:bg-secondary-fixed/10">
                      <input
                        type="checkbox"
                        checked={inclureGithub}
                        onChange={(e) => setInclureGithub(e.target.checked)}
                        className="w-5 h-5 rounded text-secondary focus:ring-secondary border-outline-variant"
                      />
                      <span className="text-body-md font-body-md">GitHub Trending</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-surface-border rounded-lg cursor-pointer hover:bg-surface-container-low transition-colors has-[input:checked]:border-secondary has-[input:checked]:bg-secondary-fixed/10">
                      <input
                        type="checkbox"
                        checked={inclureActualites}
                        onChange={(e) => setInclureActualites(e.target.checked)}
                        className="w-5 h-5 rounded text-secondary focus:ring-secondary border-outline-variant"
                      />
                      <span className="text-body-md font-body-md">Hacker News</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-sm font-label-sm text-on-surface-variant mb-2">Posts</label>
                    <div className="relative">
                      <select
                        value={nombre}
                        onChange={(e) => setNombre(Number(e.target.value))}
                        className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-4 py-3 text-body-md font-body-md focus:outline-none focus:border-secondary appearance-none pr-8"
                      >
                        <option value={3}>3 posts</option>
                        <option value={5}>5 posts</option>
                        <option value={7}>7 posts</option>
                        <option value={10}>10 posts</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" style={{ fontSize: '18px' }}>
                        expand_more
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-label-sm font-label-sm text-on-surface-variant mb-2">Durée</label>
                    <div className="relative">
                      <select
                        value={jours}
                        onChange={(e) => setJours(Number(e.target.value))}
                        className="w-full bg-surface-container-lowest border border-surface-border rounded-lg px-4 py-3 text-body-md font-body-md focus:outline-none focus:border-secondary appearance-none pr-8"
                      >
                        <option value={7}>7 jours</option>
                        <option value={14}>2 semaines</option>
                        <option value={30}>1 mois</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" style={{ fontSize: '18px' }}>
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSuggest}
                  disabled={loading}
                  className="w-full bg-primary text-on-primary font-bold py-4 rounded-lg mt-2 flex items-center justify-center gap-2 hover:bg-primary-container disabled:opacity-50 transition-colors shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
                  type="button"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    auto_awesome
                  </span>
                  {loading ? 'Génération…' : 'Suggérer un planning'}
                </button>
                <p className="text-label-sm font-label-sm text-on-surface-variant text-center">
                  {nombre} post{nombre > 1 ? 's' : ''} réparti{nombre > 1 ? 's' : ''} sur les {jours} prochains jours, à partir de demain.
                </p>
              </div>
            </div>
          </section>

          {/* List */}
          <section className="lg:col-span-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-sm font-headline-sm text-primary">Suggestions planifiées</h3>
              <span className="text-label-sm font-label-sm bg-surface-container px-3 py-1 rounded-full text-on-surface-variant">
                {items.length} idée{items.length !== 1 ? 's' : ''} générée{items.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="bg-surface border border-dashed border-surface-border rounded-xl p-8 text-center">
                  <p className="text-body-md font-body-md text-on-surface-variant">Aucune suggestion pour l'instant — clique sur &quot;Suggérer un planning&quot;.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-surface rounded-xl border border-surface-border shadow-sm flex flex-col sm:flex-row overflow-hidden group hover:shadow-md transition-shadow relative"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.statut === 'scheduled' ? 'bg-status-scheduled' : item.statut === 'published' ? 'bg-status-published' : item.statut === 'draft' ? 'bg-status-draft' : 'bg-status-idea'}`}></div>
                    <div className="bg-surface-container-low p-4 sm:w-32 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-surface-border shrink-0">
                      <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                        {item.date_planifiee ? new Date(item.date_planifiee).toLocaleDateString('fr-FR', { weekday: 'long' }) : '—'}
                      </span>
                      <span className="text-headline-md font-headline-md text-primary font-bold">
                        {item.date_planifiee ? new Date(item.date_planifiee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Sans date'}
                      </span>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-label-sm px-2 py-1 rounded-sm uppercase tracking-widest font-bold ${item.statut === 'scheduled' ? 'bg-secondary-fixed text-on-secondary-fixed' : item.statut === 'published' ? 'bg-status-published/10 text-status-published' : 'bg-primary-fixed text-on-primary-fixed'}`}>
                          {item.statut === 'scheduled' ? 'Planifié' : item.statut === 'published' ? 'Publié' : item.statut === 'idea' ? 'Idée' : 'Brouillon'}
                        </span>
                      </div>
                      <h4 className="text-body-lg font-body-lg font-semibold text-primary mb-2 line-clamp-2">{item.sujet}</h4>
                      <button onClick={() => onSelectSujet(item.sujet)} className="text-label-sm font-label-sm text-secondary flex items-center gap-1 mt-auto font-bold opacity-80 group-hover:opacity-100 transition-opacity w-fit hover:underline">
                        Développer <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      ) : (
        /* Month View */
        <div className="bg-surface border border-surface-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-container-low">
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  chevron_left
                </span>
              </button>
              <span className="font-headline-sm text-headline-sm capitalize">{formatMonthYear(currentMonth)}</span>
              <button onClick={nextMonth} className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  chevron_right
                </span>
              </button>
            </div>
            <span className="text-label-sm font-label-sm text-on-surface-variant hidden sm:inline">{items.length} posts planifiés</span>
          </div>

          <div className="grid grid-cols-7 border-b border-surface-border bg-surface-container-low">
            {weekdays.map((d) => (
              <div key={d} className="py-3 px-2 text-center font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-[minmax(120px,1fr)] bg-surface-border gap-px">
            {monthGrid.map((cell, idx) => {
              const iso = `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, '0')}-${String(cell.date.getDate()).padStart(2, '0')}`
              const dayItems = itemsByDate[iso] || []
              const isToday = new Date().toDateString() === cell.date.toDateString()
              return (
                <div
                  key={idx}
                  className={`p-2 flex flex-col gap-1 min-h-[120px] ${cell.isCurrentMonth ? 'bg-surface' : 'bg-surface-dim opacity-60'} ${isToday ? 'ring-1 ring-secondary ring-inset' : ''} hover:bg-surface-container-low transition-colors`}
                >
                  <span
                    className={`text-label-sm font-label-sm w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-on-primary font-bold' : cell.isCurrentMonth ? 'text-primary' : 'text-outline'}`}
                  >
                    {cell.day}
                  </span>
                  <div className="space-y-1">
                    {dayItems.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onSelectSujet(item.sujet)}
                        className="w-full text-left bg-surface-container-highest border border-surface-border rounded p-1.5 shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.statut === 'scheduled' ? 'bg-status-scheduled' : item.statut === 'published' ? 'bg-status-published' : item.statut === 'draft' ? 'bg-status-draft' : 'bg-status-idea'}`}></span>
                          <span className="text-[10px] font-label-sm text-on-surface-variant uppercase truncate">{item.statut}</span>
                        </div>
                        <p className="text-label-sm font-label-sm text-primary leading-tight line-clamp-2">{item.sujet}</p>
                      </button>
                    ))}
                    {dayItems.length > 3 && <p className="text-[10px] font-label-sm text-on-surface-variant">+{dayItems.length - 3} autres</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
