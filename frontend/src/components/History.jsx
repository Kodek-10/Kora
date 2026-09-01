import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const STATUT_LABELS = {
  idea: 'Idée',
  draft: 'Brouillon',
  scheduled: 'Planifié',
  published: 'Publié',
}

const STATUT_OPTIONS = ['idea', 'draft', 'scheduled', 'published']

const STATUS_STYLES = {
  idea: { border: 'bg-status-idea', chipBg: 'bg-status-idea/10', chipText: 'text-status-idea', dot: 'bg-status-idea' },
  draft: { border: 'bg-status-draft', chipBg: 'bg-status-draft/10', chipText: 'text-status-draft', dot: 'bg-status-draft' },
  scheduled: { border: 'bg-status-scheduled', chipBg: 'bg-status-scheduled/10', chipText: 'text-status-scheduled', dot: 'bg-status-scheduled' },
  published: { border: 'bg-status-published', chipBg: 'bg-status-published/10', chipText: 'text-status-published', dot: 'bg-status-published' },
}

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-display-lg font-display-lg text-primary">Historique des publications</h2>
        <div className="flex flex-wrap gap-3">
          {['', 'idea', 'draft', 'scheduled', 'published'].map((s) => {
            const active = filter === s
            return (
              <button
                key={s || 'all'}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-full font-label-sm text-label-sm uppercase tracking-wider border transition-all ${
                  active
                    ? 'bg-primary-container text-on-primary-container shadow-sm border-primary-container'
                    : 'bg-surface-container-high text-on-surface-variant border-surface-border hover:bg-surface-variant'
                }`}
              >
                {s ? STATUT_LABELS[s] : 'Tous'}
              </button>
            )
          })}
        </div>
      </div>

      {error && <p className="text-sm text-error-red bg-error-container px-4 py-2 rounded-lg">{error}</p>}
      {loading && <p className="text-sm text-on-surface-variant flex items-center gap-2"><span className="material-symbols-outlined animate-spin" style={{fontSize:'16px'}}>progress_activity</span> Chargement…</p>}

      {!loading && posts.length === 0 ? (
        <div className="bg-surface-container-lowest border border-dashed border-surface-border rounded-xl p-12 text-center">
          <p className="text-body-md font-body-md text-on-surface-variant">Aucun post pour ce filtre.</p>
          <p className="text-label-sm font-label-sm text-outline mt-1">Génère ton premier post dans l'onglet Générer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {posts.map((post) => {
            const style = STATUS_STYLES[post.statut] || STATUS_STYLES.draft
            const isEditing = editingId === post.id
            return (
              <article
                key={post.id}
                className="bg-surface border border-surface-border rounded-xl p-6 relative flex flex-col hover:shadow-lg transition-shadow duration-300 group overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.border} rounded-l-xl`}></div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Sujet</label>
                      <textarea value={editSujet} onChange={(e) => setEditSujet(e.target.value)} rows={2} maxLength={500} className="w-full rounded-lg border border-surface-border bg-surface-bright px-3 py-2 text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Texte</label>
                      <textarea value={editPost} onChange={(e) => setEditPost(e.target.value)} rows={4} placeholder="Contenu du post" className="w-full rounded-lg border border-surface-border bg-surface-bright px-3 py-2 text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Hashtags</label>
                      <input value={editHashtags} onChange={(e) => setEditHashtags(e.target.value)} placeholder="#IA #AfricaTech" className="w-full rounded-lg border border-surface-border bg-surface-bright px-3 py-2 text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Date</label>
                        <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full rounded-lg border border-surface-border bg-surface-bright px-3 py-2 text-label-md font-label-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                      </div>
                      <div>
                        <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Statut</label>
                        <select value={editStatut} onChange={(e) => setEditStatut(e.target.value)} className="w-full rounded-lg border border-surface-border bg-surface-bright px-3 py-2 text-label-md font-label-md focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                          {STATUT_OPTIONS.map((s) => (
                            <option key={s} value={s}>{STATUT_LABELS[s]}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => handleSave(post)} disabled={saving} className="flex-1 bg-secondary text-on-secondary py-2 rounded-lg font-label-md text-label-md hover:bg-on-secondary-fixed-variant disabled:opacity-50 transition-colors">
                        {saving ? '…' : 'Enregistrer'}
                      </button>
                      <button onClick={cancelEdit} disabled={saving} className="flex-1 border border-surface-border py-2 rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors">Annuler</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-label-sm text-label-sm uppercase ${style.chipBg} ${style.chipText}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                        {STATUT_LABELS[post.statut] || post.statut}
                      </span>
                      <span className="text-on-surface-variant text-label-sm font-label-sm flex items-center gap-1">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                        {new Date(post.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <h3 className="text-headline-sm font-headline-sm text-primary mb-2 line-clamp-2 group-hover:text-on-primary-container transition-colors">
                      {post.sujet}
                    </h3>

                    {post.post ? (
                      <p className="text-body-md font-body-md text-on-surface-variant line-clamp-3 mb-4 flex-1">{post.post}</p>
                    ) : (
                      <p className="text-body-md font-body-md text-outline italic line-clamp-2 mb-4 flex-1">Aucun texte généré — en attente.</p>
                    )}

                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.hashtags.map((tag) => (
                          <span key={tag} className="text-label-sm font-label-sm bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {post.image_url && (
                      <img src={post.image_url} alt="" className="w-full h-28 object-cover rounded-lg border border-surface-border mb-3" />
                    )}

                    {post.date_planifiee && (
                      <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-on-surface-variant mb-3">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_month</span>
                        Planifié : {new Date(post.date_planifiee).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-auto border-t border-surface-border pt-4 gap-2">
                      <select
                        value={post.statut}
                        onChange={(e) => handleQuickStatusChange(post, e.target.value)}
                        className="text-label-sm font-label-sm border border-surface-border rounded-lg px-2 py-1.5 bg-surface-bright focus:border-primary outline-none"
                      >
                        {STATUT_OPTIONS.map((s) => (
                          <option key={s} value={s}>{STATUT_LABELS[s]}</option>
                        ))}
                      </select>
                      <button onClick={() => startEdit(post)} className="text-primary hover:text-on-primary-container font-label-md text-label-md flex items-center gap-1 transition-colors ml-auto">
                        Éditer <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                      </button>
                    </div>
                  </>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
