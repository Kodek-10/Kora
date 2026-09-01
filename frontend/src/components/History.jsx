import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const STATUT_LABELS = {
  idea: 'Idée',
  draft: 'Brouillon',
  scheduled: 'Planifié',
  published: 'Publié',
}

const STATUT_OPTIONS = ['idea', 'draft', 'scheduled', 'published']

export default function History() {
  const [posts, setPosts] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editSujet, setEditSujet] = useState('')
  const [editPost, setEditPost] = useState('')
  const [editHashtags, setEditHashtags] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editStatut, setEditStatut] = useState('draft')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [filter])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getHistory(filter || undefined)
      setPosts(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function startEdit(post) {
    setEditingId(post.id)
    setEditSujet(post.sujet || '')
    setEditPost(post.post || '')
    setEditHashtags((post.hashtags || []).join(' '))
    setEditDate(post.date_planifiee || '')
    setEditStatut(post.statut || 'draft')
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function handleSave(post) {
    setSaving(true)
    setError(null)
    try {
      const parsedHashtags = editHashtags
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter(Boolean)

      const payload = {}
      if (editSujet !== post.sujet) payload.sujet = editSujet
      // post peut être null/empty -> envoyer null pour vider, sinon texte
      if (editPost !== (post.post || '')) payload.post = editPost || null
      const originalHashtagsStr = (post.hashtags || []).join(' ')
      if (editHashtags !== originalHashtagsStr) payload.hashtags = parsedHashtags
      const originalDate = post.date_planifiee || ''
      if (editDate !== originalDate) payload.date_planifiee = editDate || null

      if (Object.keys(payload).length > 0) {
        await api.updatePost(post.id, payload)
      }
      if (editStatut !== post.statut) {
        await api.updateStatus(post.id, editStatut)
      }
      setEditingId(null)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleQuickStatusChange(post, newStatut) {
    if (newStatut === post.statut) return
    try {
      await api.updateStatus(post.id, newStatut)
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, statut: newStatut } : p)))
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
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

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-neutral-500">Chargement…</p>}

      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="bg-white border border-neutral-200 rounded-lg p-4">
            {editingId === post.id ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Sujet</label>
                  <textarea
                    value={editSujet}
                    onChange={(e) => setEditSujet(e.target.value)}
                    rows={2}
                    maxLength={500}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Texte du post</label>
                  <textarea
                    value={editPost}
                    onChange={(e) => setEditPost(e.target.value)}
                    rows={6}
                    placeholder="Contenu du post (optionnel)"
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Hashtags — séparés par espaces ou virgules</label>
                  <input
                    value={editHashtags}
                    onChange={(e) => setEditHashtags(e.target.value)}
                    placeholder="#IA #AfricaTech"
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Date planifiée</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Statut</label>
                    <select
                      value={editStatut}
                      onChange={(e) => setEditStatut(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    >
                      {STATUT_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STATUT_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(post)}
                    disabled={saving}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md"
                  >
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={saving}
                    className="flex-1 border border-neutral-300 hover:bg-neutral-50 text-sm font-medium py-2 rounded-md"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                      {STATUT_LABELS[post.statut] || post.statut}
                    </span>
                    {post.date_planifiee && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                        {new Date(post.date_planifiee).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-400">
                    {new Date(post.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="text-sm text-neutral-800 line-clamp-3 font-medium">{post.sujet}</p>
                {post.post && <p className="text-xs text-neutral-600 line-clamp-2 mt-1">{post.post}</p>}
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.hashtags.map((tag) => (
                      <span key={tag} className="text-[11px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {post.image_url && (
                  <img src={post.image_url} alt="" className="w-full h-24 object-cover rounded-md mt-2 border border-neutral-100" />
                )}
                <div className="flex items-center gap-2 mt-3">
                  <select
                    value={post.statut}
                    onChange={(e) => handleQuickStatusChange(post, e.target.value)}
                    className="text-xs border border-neutral-200 rounded px-2 py-1 bg-white"
                  >
                    {STATUT_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {STATUT_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => startEdit(post)}
                    className="text-xs text-amber-700 font-medium hover:underline ml-auto"
                  >
                    Modifier
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {!loading && posts.length === 0 && (
          <p className="text-sm text-neutral-400">Aucun post pour ce filtre.</p>
        )}
      </div>
    </div>
  )
}
