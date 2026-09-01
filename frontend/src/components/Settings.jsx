import { useEffect, useState } from 'react'

export default function Settings() {
  const [defaultLangue, setDefaultLangue] = useState('fr')
  const [defaultTon, setDefaultTon] = useState('professionnel')
  const [githubEnabled, setGithubEnabled] = useState(true)
  const [techEnabled, setTechEnabled] = useState(true)
  const [personaBio, setPersonaBio] = useState(
    "Israel NKUNA, 20 ans, étudiant en BIT au Burkina Faso, passionné par l'IA et la Cybersécurité. J'aime partager mes découvertes techniques de manière accessible et pédagogique."
  )
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const savedLangue = localStorage.getItem('kora_default_langue')
    const savedTon = localStorage.getItem('kora_default_ton')
    const savedGithub = localStorage.getItem('kora_github_enabled')
    const savedTech = localStorage.getItem('kora_tech_enabled')
    const savedBio = localStorage.getItem('kora_persona_bio')
    if (savedLangue) setDefaultLangue(savedLangue)
    if (savedTon) setDefaultTon(savedTon)
    if (savedGithub !== null) setGithubEnabled(savedGithub === 'true')
    if (savedTech !== null) setTechEnabled(savedTech === 'true')
    if (savedBio) setPersonaBio(savedBio)
  }, [])

  function handleSave() {
    localStorage.setItem('kora_default_langue', defaultLangue)
    localStorage.setItem('kora_default_ton', defaultTon)
    localStorage.setItem('kora_github_enabled', String(githubEnabled))
    localStorage.setItem('kora_tech_enabled', String(techEnabled))
    localStorage.setItem('kora_persona_bio', personaBio)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    setDefaultLangue('fr')
    setDefaultTon('décontracté')
    setGithubEnabled(true)
    setTechEnabled(true)
    setPersonaBio(
      "Israel NKUNA, 20 ans, étudiant en BIT au Burkina Faso, passionné par l'IA et la Cybersécurité. J'aime partager mes découvertes techniques de manière accessible et pédagogique."
    )
    localStorage.removeItem('kora_default_langue')
    localStorage.removeItem('kora_default_ton')
    localStorage.removeItem('kora_github_enabled')
    localStorage.removeItem('kora_tech_enabled')
    localStorage.removeItem('kora_persona_bio')
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end justify-between border-b border-surface-border pb-4 sm:pb-6">
        <div className="min-w-0">
          <h2 className="text-[28px] leading-8 sm:text-display-lg font-display-lg text-primary">Paramètres</h2>
          <p className="text-body-md sm:text-body-lg font-body-lg text-on-surface-variant mt-2 max-w-2xl text-sm sm:text-body-lg">
            Configurez votre environnement de génération, vos clés API et vos préférences de style.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          <button onClick={handleReset} className="w-full sm:w-auto px-6 py-3 rounded-lg border border-surface-border text-primary font-headline-sm text-headline-sm hover:bg-surface-container-low transition-colors min-h-[48px]">
            Réinitialiser
          </button>
          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-secondary text-on-secondary font-headline-sm text-headline-sm shadow-md hover:bg-on-secondary-fixed-variant transition-colors flex items-center justify-center gap-2 min-h-[48px]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              save
            </span>
            {saved ? 'Sauvegardé !' : 'Sauvegarder'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-gutter items-start">
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">
          <section className="bg-surface-container-lowest rounded-xl border border-surface-border p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-surface-border pb-4">
              <span className="material-symbols-outlined text-secondary">api</span>
              <h3 className="text-headline-md font-headline-md text-primary">Configuration API</h3>
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-label-md font-label-md text-on-surface-variant flex items-center gap-2" htmlFor="gemini-key">
                  Clé API Gemini <span className="text-error-red">*</span>
                </label>
                <input
                  id="gemini-key"
                  type="password"
                  value="••••••••••••••••••••••••"
                  readOnly
                  className="w-full px-4 py-3 rounded-lg border border-surface-border bg-surface-container-low text-outline focus:outline-none font-label-md text-label-md"
                />
                <p className="text-label-sm font-label-sm text-outline">
                  Configurée dans <code className="bg-surface-container px-1 py-0.5 rounded text-on-surface-variant">backend/.env</code> → <code>GEMINI_API_KEY</code>. Redémarre le backend après modification.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-label-md font-label-md text-on-surface-variant flex items-center justify-between" htmlFor="github-token">
                  Token GitHub
                  <span className="text-status-idea bg-surface-container-high px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-label-sm">Optionnel</span>
                </label>
                <input
                  id="github-token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={githubEnabled ? '••••••••••••' : ''}
                  readOnly
                  className="w-full px-4 py-3 rounded-lg border border-surface-border bg-surface-container-low text-outline focus:outline-none font-label-md text-label-md"
                />
                <p className="text-label-sm font-label-sm text-outline">
                  Défini dans <code className="bg-surface-container px-1 py-0.5 rounded">GITHUB_TOKEN</code> (optionnel, 60 req/h sans token → 5000/h avec). Voir{' '}
                  <code className="bg-surface-container px-1 py-0.5 rounded">backend/.env.example</code>.
                </p>
              </div>
              <div className="bg-secondary-container/20 border border-secondary-container rounded-lg p-3 flex gap-2">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>
                  info
                </span>
                <p className="text-label-sm font-label-sm text-on-secondary-container">
                  Kora est locale : aucune clé n&apos;est envoyée au frontend. Tout est lu côté backend via <code>app/config.py</code>.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl border border-surface-border p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 sm:mb-6 border-b border-surface-border pb-4">
              <span className="material-symbols-outlined text-secondary">person_edit</span>
              <h3 className="text-headline-sm sm:text-headline-md font-headline-md text-primary">Profil &amp; Style (Persona)</h3>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-label-md font-label-md text-on-surface-variant flex items-center justify-between" htmlFor="persona-bio">
                Bio / Style personnalisé
                <span className="text-label-sm font-label-sm text-outline">{personaBio.length}/500</span>
              </label>
                <textarea
                id="persona-bio"
                value={personaBio}
                onChange={(e) => setPersonaBio(e.target.value)}
                rows={5}
                maxLength={500}
                className="w-full px-3 sm:px-4 py-3 rounded-lg border border-surface-border bg-surface-bright focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md text-primary resize-y text-[16px]"
              />
              <p className="text-label-sm font-label-sm text-outline mt-1">
                Stocké localement (localStorage). Le prompt réel est dans <code className="bg-surface-container px-1 py-0.5 rounded">backend/app/services/gemini_service.py</code> → <code>STYLE_PROMPT</code>.
              </p>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4 sm:gap-6">
          <section className="bg-surface-container-lowest rounded-xl border border-surface-border p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 sm:mb-6 border-b border-surface-border pb-4">
              <span className="material-symbols-outlined text-secondary">tune</span>
              <h3 className="text-headline-sm sm:text-headline-md font-headline-md text-primary">Préférences</h3>
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-label-md font-label-md text-on-surface-variant">Langue par défaut</label>
                <div className="relative">
                  <select
                    value={defaultLangue}
                    onChange={(e) => setDefaultLangue(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-surface-border bg-surface-bright focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none font-body-md text-body-md text-primary pr-8"
                  >
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" style={{ fontSize: '20px' }}>
                    expand_more
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-label-md font-label-md text-on-surface-variant">Ton par défaut</label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'décontracté', label: 'Décontracté' },
                    { value: 'professionnel', label: 'Professionnel' },
                    { value: 'inspirant', label: 'Inspirant' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border hover:bg-surface-container-low cursor-pointer transition-colors ${defaultTon === opt.value ? 'border-secondary bg-secondary-fixed/10' : 'border-surface-border'}`}
                    >
                      <input
                        type="radio"
                        name="tone"
                        value={opt.value}
                        checked={defaultTon === opt.value}
                        onChange={(e) => setDefaultTon(e.target.value)}
                        className="text-secondary focus:ring-secondary w-4 h-4 border-outline"
                      />
                      <span className="text-body-md font-body-md text-primary">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl border border-surface-border p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 sm:mb-6 border-b border-surface-border pb-4">
              <span className="material-symbols-outlined text-secondary">explore</span>
              <h3 className="text-headline-sm sm:text-headline-md font-headline-md text-primary">Sources d&apos;inspiration</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-bright border border-surface-border">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant">terminal</span>
                  <span className="text-body-md font-body-md text-primary font-medium">Activité GitHub</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={githubEnabled} onChange={(e) => setGithubEnabled(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-secondary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-bright border border-surface-border">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant">newspaper</span>
                  <span className="text-body-md font-body-md text-primary font-medium">Actualité Tech</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={techEnabled} onChange={(e) => setTechEnabled(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-secondary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>
              <p className="text-label-sm font-label-sm text-outline mt-2 text-center">Préférences stockées localement et utilisées pour pré-cocher le calendrier.</p>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl border border-surface-border p-4 shadow-sm">
            <h4 className="text-label-md font-label-md text-primary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>
                database
              </span>
              Base de données
            </h4>
            <p className="text-label-sm font-label-sm text-on-surface-variant">
              SQLite locale <code className="bg-surface-container px-1 py-0.5 rounded">backend/kora.db</code> — sauvegarde = copier le fichier. Voir <code>docs/SETUP.md</code>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
