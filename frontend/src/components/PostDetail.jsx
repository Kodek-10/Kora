import { useEffect, useState } from 'react'
import { api } from '../lib/api'

const STATUT_LABELS = {
  idea: 'Idée',
  draft: 'Brouillon',
  scheduled: 'Planifié',
  published: 'Publié',
}

const STATUS_STYLES = {
  idea: { dot: 'bg-status-idea', chipBg: 'bg-status-idea/10', chipText: 'text-status-idea' },
  draft: { dot: 'bg-status-draft', chipBg: 'bg-status-draft/10', chipText: 'text-status-draft' },
  scheduled: { dot: 'bg-status-scheduled', chipBg: 'bg-status-scheduled/10', chipText: 'text-status-scheduled' },
  published: { dot: 'bg-status-published', chipBg: 'bg-status-published/10', chipText: 'text-status-published' },
}

export default function PostDetail({ postId, initialPost, onBack, onDeleted }) {
  const [post, setPost] = useState(initialPost || null)
  const [loading, setLoading] = useState(!initialPost)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    if (initialPost) {
      setPost(initialPost)
      setLoading(false)
      return
    }
    if (!postId) return
    setLoading(true)
    api
      .getPost(postId)
      .then((data) => setPost(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [postId, initialPost])

  async function handleCopy() {
    if (!post?.post) return
    try {
      await navigator.clipboard.writeText(post.post)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = post.post
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleDelete() {
    if (!post) return
    setDeleting(true)
    try {
      await api.deletePost(post.id)
      onDeleted?.(post.id)
      onBack?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  async function handleRegenerateImage() {
    if (!post) return
    setRegenerating(true)
    setError(null)
    try {
      const updated = await api.regenerateImage(post.id)
      setPost(updated)
    } catch (e) {
      setError(e.message)
    } finally {
      setRegenerating(false)
    }
  }

  function handleDownload() {
    if (!post?.image_url) return
    const a = document.createElement('a')
    a.href = post.image_url
    a.download = `kora-image-${Date.now()}.jpg`
    a.click()
  }

  if (loading) {
    return (
      <div className="bg-surface-container-lowest border border-surface-border rounded-xl p-12 text-center">
        <p className="text-body-md font-body-md text-on-surface-variant flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>
            progress_activity
          </span>
          Chargement…
        </p>
      </div>
    )
  }

  if (error && !post) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-label-md font-label-md text-on-surface-variant hover:text-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            arrow_back
          </span>
          Retour à l'historique
        </button>
        <div className="bg-error-container border border-error text-on-error-container rounded-xl p-6">
          <p className="text-body-md font-body-md">{error}</p>
        </div>
      </div>
    )
  }

  if (!post) return null

  const style = STATUS_STYLES[post.statut] || STATUS_STYLES.draft

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <button onClick={onBack} className="self-start inline-flex items-center gap-1.5 text-label-md font-label-md text-on-surface-variant hover:text-primary hover:bg-surface-container-high px-2 py-1 rounded-lg transition-colors">
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
          arrow_back
        </span>
        Retour à l'historique
      </button>

      {error && <p className="text-sm text-error-red bg-error-container px-4 py-2 rounded-lg">{error}</p>}

      <article className="bg-surface-container-lowest rounded-xl border border-surface-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-surface-border bg-surface/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-label-sm text-label-sm uppercase ${style.chipBg} ${style.chipText}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
              {STATUT_LABELS[post.statut] || post.statut}
            </span>
            {post.date_planifiee && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary-fixed/20 text-on-secondary-fixed font-label-sm text-label-sm">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  calendar_month
                </span>
                {new Date(post.date_planifiee).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>
          <span className="text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              schedule
            </span>
            Créé le {new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Sujet */}
        <div className="px-4 sm:px-6 py-5 border-b border-surface-border">
          <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Sujet</p>
          <h1 className="text-headline-sm sm:text-headline-md font-headline-md text-primary break-words">{post.sujet}</h1>
          <div className="flex flex-wrap gap-2 mt-3 text-label-sm font-label-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                palette
              </span>
              Ton : {post.ton}
            </span>
            <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                language
              </span>
              {post.langue === 'fr' ? 'Français' : 'Anglais'}
            </span>
            <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                update
              </span>
              MAJ : {new Date(post.updated_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>

        {/* Image */}
        {post.image_url && (
          <div className="relative bg-surface-container group">
            <img src={post.image_url} alt="Visuel du post" className="w-full max-h-[420px] object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button onClick={handleDownload} className="bg-surface-container-lowest text-on-surface px-4 py-2 rounded-full font-label-sm text-label-sm shadow-lg hover:bg-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  download
                </span>
                Télécharger
              </button>
              <button
                onClick={handleRegenerateImage}
                disabled={regenerating}
                className="bg-surface-container-lowest text-on-surface px-4 py-2 rounded-full font-label-sm text-label-sm shadow-lg hover:bg-surface flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  refresh
                </span>
                {regenerating ? '…' : 'Régénérer'}
              </button>
            </div>
          </div>
        )}

        {/* Texte intégral */}
        <div className="px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-label-md font-label-md text-on-surface">Texte intégral</h2>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm hover:bg-inverse-surface transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                content_copy
              </span>
              {copied ? 'Copié !' : 'Copier le texte'}
            </button>
          </div>
          {post.post ? (
            <div className="bg-surface-bright border border-surface-border rounded-lg p-4 sm:p-5">
              <p className="text-body-md sm:text-body-lg font-body-lg text-on-surface whitespace-pre-wrap break-words leading-relaxed">{post.post}</p>
            </div>
          ) : (
            <p className="text-body-md font-body-md text-outline italic">Aucun texte généré pour ce post.</p>
          )}

          {post.hashtags && post.hashtags.length > 0 && (
            <div className="mt-5">
              <p className="text-label-sm font-label-sm text-on-surface-variant mb-2">Hashtags</p>
              <div className="flex flex-wrap gap-2">
                {post.hashtags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-primary/10 text-primary font-label-sm text-label-sm rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-surface-border bg-surface/50 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {!post.image_url && (
              <button
                onClick={handleRegenerateImage}
                disabled={regenerating}
                className="px-4 py-2.5 border border-surface-border bg-surface-bright rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  image
                </span>
                Générer l'image
              </button>
            )}
            {post.image_url && (
              <button onClick={handleDownload} className="px-4 py-2.5 border border-surface-border bg-surface-bright rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  download
                </span>
                Télécharger
              </button>
            )}
          </div>

          <div className="flex gap-2 sm:ml-auto">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 sm:flex-none px-4 py-2.5 border border-error text-error hover:bg-error-container rounded-lg font-label-md text-label-md transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  delete
                </span>
                Supprimer
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-error-container border border-error rounded-lg px-3 py-1">
                <span className="text-label-sm font-label-sm text-on-error-container whitespace-nowrap">Confirmer ?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 bg-error text-on-error rounded-md font-label-sm text-label-sm hover:bg-on-error-container disabled:opacity-50"
                >
                  {deleting ? '…' : 'Oui, supprimer'}
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 bg-surface rounded-md font-label-sm text-label-sm border border-surface-border">
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>
      </article>

      <p className="text-center text-label-sm font-label-sm text-outline">
        ID : <span className="font-mono">{post.id}</span> • Ctrl+C pour copier le texte
      </p>
    </div>
  )
}
