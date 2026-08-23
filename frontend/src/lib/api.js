// Fonction utilitaire centralisée pour tous les appels au backend.
// L'URL de base est configurable via variable d'environnement Vite,
// pratique si tu changes un jour de port ou de machine.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.detail || `Erreur ${response.status}`)
  }
  return response.json()
}

export const api = {
  generatePost: (payload) =>
    request('/api/generate-post', { method: 'POST', body: JSON.stringify(payload) }),

  getHistory: (statut) =>
    request(`/api/history${statut ? `?statut=${statut}` : ''}`),

  getCalendar: () => request('/api/calendar'),

  suggestTopics: ({ theme, nombre, jours, inclureGithub, inclureActualites }) =>
    request('/api/calendar/suggest', {
      method: 'POST',
      body: JSON.stringify({
        theme,
        nombre,
        jours,
        inclure_github: inclureGithub,
        inclure_actualites: inclureActualites,
      }),
    }),

  updateStatus: (postId, statut) =>
    request(`/api/posts/${postId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ statut }),
    }),
}
