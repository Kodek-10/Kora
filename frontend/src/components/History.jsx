import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const STATUT_LABELS = {
  idea: 'Idée',
  draft: 'Brouillon',
  scheduled: 'Planifié',
  published: 'Publié',
}

export default function History() {
  const [posts, setPosts] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [filter])

  async function load() {
    setLoading(true)
    try {
      const data = await api.getHistory(filter || undefined)
      setPosts(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['', 'idea', 'draft', 'scheduled', 'published'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1 rounded-full ${
              filter === s ? 'bg-amber-600 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {s ? STATUT_LABELS[s] : 'Tous'}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-neutral-500">Chargement…</p>}

      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                {STATUT_LABELS[post.statut] || post.statut}
              </span>
              <span className="text-xs text-neutral-400">
                {new Date(post.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <p className="text-sm text-neutral-800 line-clamp-3">{post.sujet}</p>
          </div>
        ))}
        {!loading && posts.length === 0 && (
          <p className="text-sm text-neutral-400">Aucun post pour ce filtre.</p>
        )}
      </div>
    </div>
  )
}
