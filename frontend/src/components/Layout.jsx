export default function Layout({ children, activeTab, onTabChange }) {
  const tabs = [
    { id: 'generate', label: 'Générer' },
    { id: 'history', label: 'Historique' },
    { id: 'calendar', label: 'Calendrier éditorial' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-amber-700">Kora</h1>
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
