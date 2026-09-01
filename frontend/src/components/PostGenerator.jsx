import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function PostGenerator({ initialSujet = '' }) {
  const [sujet, setSujet] = useState(initialSujet)
  const [ton, setTon] = useState('décontracté')
  const [langue, setLangue] = useState('fr')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [editedText, setEditedText] = useState('')
  const [editedHashtags, setEditedHashtags] = useState('')
  const [editedDate, setEditedDate] = useState('')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [regeneratingImage, setRegeneratingImage] = useState(false)

  useEffect(() => {
    if (initialSujet) setSujet(initialSujet)
  }, [initialSujet])

  // Préférences par défaut depuis Paramètres (localStorage)
  useEffect(() => {
    const savedTon = localStorage.getItem('kora_default_ton')
    const savedLangue = localStorage.getItem('kora_default_langue')
    if (savedTon && ['décontracté', 'professionnel', 'inspirant'].includes(savedTon)) setTon(savedTon)
    if (savedLangue && ['fr', 'en'].includes(savedLangue)) setLangue(savedLangue)
  }, [])

  async function handleGenerate() {
    if (sujet.trim().length < 10) {
      setError('Le sujet doit faire au moins 10 caractères.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await api.generatePost({ sujet, ton, langue })
      setResult(data)
      setEditedText(data.post)
      setEditedHashtags((data.hashtags || []).join(' '))
      setEditedDate(data.date_planifiee || '')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(editedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = editedText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleSave() {
    if (!result) return
    setSaving(true)
    setError(null)
    try {
      const parsedHashtags = editedHashtags
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter(Boolean)
      const payload = {
        post: editedText,
        hashtags: parsedHashtags,
        date_planifiee: editedDate || null,
      }
      const updated = await api.updatePost(result.id, payload)
      setResult((prev) => ({
        ...prev,
        post: updated.post,
        hashtags: updated.hashtags || parsedHashtags,
        date_planifiee: updated.date_planifiee,
      }))
      setEditedHashtags((updated.hashtags || []).join(' '))
      setEditedDate(updated.date_planifiee || '')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRegenerateImage() {
    if (!result) return
    setRegeneratingImage(true)
    setError(null)
    try {
      const updated = await api.regenerateImage(result.id)
      setResult((prev) => ({ ...prev, image_url: updated.image_url }))
    } catch (e) {
      setError(e.message)
    } finally {
      setRegeneratingImage(false)
    }
  }

  function handleDownloadImage() {
    if (!result?.image_url) return
    const link = document.createElement('a')
    link.href = result.image_url
    link.download = `kora-image-${Date.now()}.jpg`
    link.click()
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
      {/* Left: Form */}
      <section className="xl:col-span-5 flex flex-col">
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_12px_rgba(15,23,42,0.04)] border border-surface-border flex flex-col h-full">
          <h2 className="text-headline-sm font-headline-sm text-primary mb-6">Créer un nouveau post</h2>
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-label-md font-label-md text-on-surface" htmlFor="prompt-input">
                De quoi veux-tu parler ?
              </label>
              <div className="relative">
                <textarea
                  id="prompt-input"
                  value={sujet}
                  onChange={(e) => setSujet(e.target.value)}
                  rows={5}
                  maxLength={500}
                  placeholder="Ex: Les 3 avantages de l'intelligence artificielle pour les designers UX..."
                  className="w-full bg-surface-bright border border-surface-border rounded-lg p-4 text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none pr-16"
                />
                <span className="absolute bottom-3 right-3 text-label-sm font-label-sm text-on-surface-variant">
                  {sujet.length}/500
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-label-md font-label-md text-on-surface" htmlFor="tone-select">
                  Ton
                </label>
                <div className="relative">
                  <select
                    id="tone-select"
                    value={ton}
                    onChange={(e) => setTon(e.target.value)}
                    className="w-full bg-surface-bright border border-surface-border rounded-lg p-3 text-body-md font-body-md appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer pr-8"
                  >
                    <option value="décontracté">Décontracté</option>
                    <option value="professionnel">Professionnel</option>
                    <option value="inspirant">Inspirant</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                    expand_more
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-label-md font-label-md text-on-surface" htmlFor="lang-select">
                  Langue
                </label>
                <div className="relative">
                  <select
                    id="lang-select"
                    value={langue}
                    onChange={(e) => setLangue(e.target.value)}
                    className="w-full bg-surface-bright border border-surface-border rounded-lg p-3 text-body-md font-body-md appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer pr-8"
                  >
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                    expand_more
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-8 w-full bg-secondary text-on-secondary py-4 rounded-lg font-label-md text-label-md font-bold shadow-[0_4px_12px_rgba(0,108,73,0.2)] hover:bg-on-secondary-fixed-variant disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2 group"
          >
            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform" style={{ fontSize: '18px' }}>
              auto_awesome
            </span>
            {loading ? 'Génération en cours…' : 'Générer le post'}
          </button>
          {error && <p className="text-sm text-error-red mt-3">{error}</p>}
        </div>
      </section>

      {/* Right: Result */}
      <section className="xl:col-span-7 flex flex-col">
        {result ? (
          <div className="bg-surface-container-lowest rounded-xl p-0 shadow-[0_4px_12px_rgba(15,23,42,0.04)] border border-surface-border overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-surface-border bg-surface/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-published"></span>
                <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Aperçu Généré</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRegenerateImage}
                  disabled={regeneratingImage}
                  className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-md transition-colors disabled:opacity-50"
                  title="Régénérer l'image"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    refresh
                  </span>
                </button>
              </div>
            </div>

            {result.image_url && (
              <div className="relative w-full h-64 md:h-80 bg-surface-container group overflow-hidden">
                <img src={result.image_url} alt="Visuel généré" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button
                    onClick={handleDownloadImage}
                    className="bg-surface-container-lowest text-on-surface py-2 px-4 rounded-full font-label-sm text-label-sm flex items-center gap-2 hover:bg-surface transition-colors shadow-lg"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      download
                    </span>
                    Télécharger l'image
                  </button>
                </div>
              </div>
            )}

            <div className="p-6 flex-1 flex flex-col gap-4">
              <div className="space-y-2">
                <label className="block text-label-sm font-label-sm text-on-surface-variant">Texte — relis avant de copier</label>
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  rows={8}
                  className="w-full bg-transparent border border-dashed border-transparent hover:border-surface-border focus:border-primary rounded-lg p-3 -ml-1 text-body-lg font-body-lg text-on-surface resize-none outline-none transition-colors bg-surface-bright focus:bg-surface-container-lowest"
                  placeholder="Le texte généré apparaîtra ici…"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-label-sm font-label-sm text-on-surface-variant">Hashtags — espaces ou virgules</label>
                <input
                  value={editedHashtags}
                  onChange={(e) => setEditedHashtags(e.target.value)}
                  placeholder="#IA #AfricaTech #Cybersecurite"
                  className="w-full bg-surface-bright border border-surface-border rounded-lg px-3 py-2 text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  {editedHashtags
                    .split(/[\s,]+/)
                    .filter(Boolean)
                    .map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-primary/10 text-primary text-label-sm font-label-sm rounded uppercase">
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </span>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-label-sm font-label-sm text-on-surface-variant">Date planifiée (optionnelle)</label>
                <input
                  type="date"
                  value={editedDate}
                  onChange={(e) => setEditedDate(e.target.value)}
                  className="w-full bg-surface-bright border border-surface-border rounded-lg px-3 py-2 text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
                <p className="text-label-sm font-label-sm text-outline">Laisse vide pour un brouillon sans date.</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-surface-border bg-surface/50 flex flex-wrap justify-end gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 border border-surface-border text-on-surface-variant font-label-md text-label-md rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  bookmark_border
                </span>
                {saved ? 'Enregistré !' : saving ? 'Enregistrement…' : 'Sauvegarder'}
              </button>
              <button
                onClick={handleCopy}
                className="px-6 py-2 bg-primary text-on-primary font-label-md text-label-md rounded-lg shadow-[0_4px_12px_rgba(15,23,42,0.15)] hover:bg-inverse-surface transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  content_copy
                </span>
                {copied ? 'Copié !' : 'Copier le texte'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-xl p-12 shadow-[0_4px_12px_rgba(15,23,42,0.04)] border border-dashed border-surface-border flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '32px' }}>
                auto_awesome
              </span>
            </div>
            <h3 className="text-headline-sm font-headline-sm text-primary mb-2">Aucun post généré</h3>
            <p className="text-body-md font-body-md text-on-surface-variant max-w-sm">
              Choisis un sujet à gauche, clique sur Générer et ton post apparaîtra ici pour relecture.
            </p>
            {error && <p className="text-sm text-error-red mt-4">{error}</p>}
          </div>
        )}
      </section>
    </div>
  )
}
