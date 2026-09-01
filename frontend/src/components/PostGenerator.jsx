import { useEffect, useState } from 'react'
import { api } from '../lib/api'

// Note de conception : le texte généré est affiché dans un <textarea> modifiable,
// pas en lecture seule — c'est l'espace de relecture recommandé avant de copier,
// pour limiter le risque de publier une hallucination sans l'avoir relue.

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

  // Pré-remplissage depuis le calendrier ("Développer →") : le composant
  // peut rester monté lors du changement d'onglet, on resynchronise.
  useEffect(() => {
    if (initialSujet) setSujet(initialSujet)
  }, [initialSujet])

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
      // Repli si l'API clipboard échoue (contexte restreint / navigateur ancien)
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-neutral-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Sujet</label>
          <textarea
            value={sujet}
            onChange={(e) => setSujet(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="De quoi veux-tu parler ?"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Ton</label>
            <select
              value={ton}
              onChange={(e) => setTon(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="décontracté">Décontracté</option>
              <option value="professionnel">Professionnel</option>
              <option value="inspirant">Inspirant</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Langue</label>
            <select
              value={langue}
              onChange={(e) => setLangue(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="fr">Français</option>
              <option value="en">Anglais</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-medium py-2 rounded-md transition"
        >
          {loading ? 'Génération en cours…' : 'Générer le post'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {result && (
        <div className="bg-white rounded-lg border border-neutral-200 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Texte généré — relis avant de copier
            </label>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={12}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          {result.image_url && (
            <div className="space-y-2">
              <img src={result.image_url} alt="Visuel généré" className="w-full rounded-md" />
              <button
                onClick={handleRegenerateImage}
                disabled={regeneratingImage}
                className="text-xs text-amber-700 font-medium hover:underline disabled:opacity-50"
              >
                {regeneratingImage ? 'Régénération…' : 'Régénérer l\u2019image'}
              </button>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-medium text-neutral-600">Hashtags — séparés par espaces ou virgules</label>
            <input
              value={editedHashtags}
              onChange={(e) => setEditedHashtags(e.target.value)}
              placeholder="#IA #AfricaTech #Cybersecurite"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              {editedHashtags
                .split(/[\s,]+/)
                .filter(Boolean)
                .map((tag) => (
                  <span key={tag} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Date planifiée (optionnelle)</label>
            <input
              type="date"
              value={editedDate}
              onChange={(e) => setEditedDate(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <p className="text-xs text-neutral-400 mt-1">Laisse vide pour un brouillon sans date, ou choisis une date pour planifier.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 bg-neutral-800 hover:bg-neutral-900 text-white text-sm font-medium py-2 rounded-md transition"
            >
              {copied ? 'Copié !' : 'Copier le texte'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 border border-amber-600 text-amber-700 hover:bg-amber-50 disabled:opacity-50 text-sm font-medium py-2 rounded-md transition"
            >
              {saved ? 'Enregistré !' : saving ? 'Enregistrement…' : 'Enregistrer la relecture'}
            </button>
            <button
              onClick={handleDownloadImage}
              className="flex-1 border border-neutral-300 hover:bg-neutral-50 text-sm font-medium py-2 rounded-md transition"
            >
              Télécharger l'image
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
