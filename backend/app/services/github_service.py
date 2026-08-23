"""Service de récupération de l'activité GitHub publique récente — utilisée
comme contexte pour inspirer les suggestions de sujets de posts.

Utilise l'API publique GitHub (aucune clé requise pour les données publiques,
mais un token personnel augmente la limite de requêtes de 60/h à 5000/h —
recommandé si tu suggères des sujets souvent).
"""

import requests

from app.config import GITHUB_USERNAME, GITHUB_TOKEN

GITHUB_API_BASE = "https://api.github.com"

EVENT_LABELS = {
    "PushEvent": "commits récents",
    "CreateEvent": "nouveau dépôt ou branche créé",
    "PullRequestEvent": "pull request",
    "IssuesEvent": "issue",
    "ReleaseEvent": "nouvelle release publiée",
}


def _headers() -> dict:
    headers = {"Accept": "application/vnd.github+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers


def get_recent_activity_summary(max_repos: int = 5) -> str:
    """Retourne un résumé texte de l'activité GitHub publique récente
    (dépôts touchés, type d'activité). Échoue silencieusement (retourne "")
    si GITHUB_USERNAME n'est pas configuré ou si l'API est indisponible —
    le calendrier éditorial doit continuer à fonctionner sans GitHub."""
    if not GITHUB_USERNAME:
        return ""

    try:
        response = requests.get(
            f"{GITHUB_API_BASE}/users/{GITHUB_USERNAME}/events/public",
            headers=_headers(),
            params={"per_page": 30},
            timeout=10,
        )
        response.raise_for_status()
        events = response.json()
    except requests.RequestException:
        return ""

    seen_repos: dict[str, str] = {}
    for event in events:
        event_type = event.get("type")
        repo_name = event.get("repo", {}).get("name")
        if not repo_name or event_type not in EVENT_LABELS:
            continue
        if repo_name not in seen_repos:
            seen_repos[repo_name] = event_type
        if len(seen_repos) >= max_repos:
            break

    if not seen_repos:
        return ""

    lines = [f"- {repo} ({EVENT_LABELS[event_type]})" for repo, event_type in seen_repos.items()]
    return "Activité GitHub récente de l'utilisateur :\n" + "\n".join(lines)
