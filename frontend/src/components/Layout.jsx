export default function Layout({ children, activeTab, onTabChange }) {
  const navItems = [
    { id: 'generate', label: 'Générer', icon: 'edit_note' },
    { id: 'history', label: 'Historique', icon: 'history' },
    { id: 'calendar', label: 'Calendrier', icon: 'calendar_month' },
  ]

  const isActive = (id) => activeTab === id

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md flex flex-col selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Desktop SideNav */}
      <nav className="hidden lg:flex flex-col h-screen fixed left-0 top-0 p-4 gap-4 w-64 bg-surface-container-low border-r border-surface-border z-40">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-headline-md font-bold shrink-0">
            K
          </div>
          <div>
            <h1 className="text-headline-sm font-headline-sm font-black text-primary leading-none">Kora AI</h1>
            <p className="text-label-sm font-label-sm text-on-surface-variant">Créateur de contenu</p>
          </div>
        </div>

        <button
          onClick={() => onTabChange('generate')}
          className="w-full bg-primary text-on-primary py-3 px-4 rounded-lg font-label-md text-label-md flex justify-center items-center gap-2 hover:bg-inverse-surface transition-colors shadow-sm mb-2"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            add
          </span>
          Nouveau Post
        </button>

        <div className="flex flex-col gap-2 flex-1 mt-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all ${
                isActive(item.id)
                  ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm scale-[0.98]'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: isActive(item.id) ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="text-label-md font-label-md">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-surface-border">
          <button
            onClick={() => onTabChange('settings')}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all ${
              isActive('settings')
                ? 'bg-secondary-container text-on-secondary-container font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: isActive('settings') ? "'FILL' 1" : "'FILL' 0" }}
            >
              settings
            </span>
            <span className="text-label-md font-label-md">Paramètres</span>
          </button>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container-high rounded-lg transition-all text-label-md font-label-md"
          >
            <span className="material-symbols-outlined">help</span>
            <span>Aide</span>
          </a>
        </div>
      </nav>

      {/* Mobile TopNav */}
      <header className="lg:hidden sticky top-0 z-50 flex items-center justify-between gap-2 w-full px-4 py-3 border-b border-surface-border bg-surface text-primary">
        <div className="text-headline-md-mobile font-headline-md-mobile font-bold shrink-0">Kora</div>
        <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto no-scrollbar">
          <button onClick={() => onTabChange('generate')} className={`whitespace-nowrap text-label-sm sm:text-label-md font-label-md px-1.5 sm:px-2 pb-1 border-b-2 transition-colors ${isActive('generate') ? 'text-primary border-primary font-bold' : 'text-on-surface-variant border-transparent'}`}>
            Générer
          </button>
          <button onClick={() => onTabChange('history')} className={`whitespace-nowrap text-label-sm sm:text-label-md font-label-md px-1.5 sm:px-2 pb-1 border-b-2 transition-colors ${isActive('history') ? 'text-primary border-primary font-bold' : 'text-on-surface-variant border-transparent'}`}>
            Historique
          </button>
          <button onClick={() => onTabChange('calendar')} className={`whitespace-nowrap text-label-sm sm:text-label-md font-label-md px-1.5 sm:px-2 pb-1 border-b-2 transition-colors ${isActive('calendar') ? 'text-primary border-primary font-bold' : 'text-on-surface-variant border-transparent'}`}>
            Calendrier
          </button>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-on-surface-variant shrink-0">
          <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors hidden sm:inline" style={{ fontSize: '20px' }}>notifications</span>
          <button onClick={() => onTabChange('settings')} className={`${isActive('settings') ? 'text-primary' : 'text-on-surface-variant'} p-1`}>
            <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors" style={{ fontSize: '20px' }}>account_circle</span>
          </button>
        </div>
      </header>

      {/* Mobile Tabs (secondary, under top nav) - textile stitch historique has second row */}
      {/* We keep single row top nav for simplicity */}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 w-full min-h-screen overflow-x-hidden">
        <div className="max-w-container-max mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-10 pb-28 lg:pb-10">{children}</div>
      </main>

      {/* Mobile BottomNav */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-surface border-t border-surface-border flex justify-around items-center py-2 z-50 px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button onClick={() => onTabChange('generate')} className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${isActive('generate') ? 'text-secondary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('generate') ? "'FILL' 1" : "'FILL' 0" }}>
            edit_note
          </span>
          <span className="text-[10px] font-label-sm">Générer</span>
        </button>
        <button onClick={() => onTabChange('history')} className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${isActive('history') ? 'text-secondary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('history') ? "'FILL' 1" : "'FILL' 0" }}>
            history
          </span>
          <span className="text-[10px] font-label-sm">Historique</span>
        </button>
        <button onClick={() => onTabChange('calendar')} className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${isActive('calendar') ? 'text-secondary' : 'text-on-surface-variant'}`}>
          <span className={`material-symbols-outlined ${isActive('calendar') ? 'bg-secondary-container text-on-secondary-container px-3 py-0.5 rounded-full' : ''}`} style={{ fontVariationSettings: isActive('calendar') ? "'FILL' 1" : "'FILL' 0" }}>
            calendar_month
          </span>
          <span className={`text-[10px] font-label-sm ${isActive('calendar') ? 'font-bold text-on-secondary-container' : ''}`}>Calendrier</span>
        </button>
        <button onClick={() => onTabChange('settings')} className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${isActive('settings') ? 'text-secondary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive('settings') ? "'FILL' 1" : "'FILL' 0" }}>
            settings
          </span>
          <span className="text-[10px] font-label-sm">Paramètres</span>
        </button>
      </nav>
    </div>
  )
}
