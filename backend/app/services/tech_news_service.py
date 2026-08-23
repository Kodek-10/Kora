"""Service de récupération de sujets d'actualité tech récents, via l'API
publique de Hacker News (gratuite, aucune clé requise) — utilisé comme
contexte pour inspirer les suggestions de sujets de posts."""

import requests

HN_API_BASE = "https://hacker-news.firebaseio.com/v0"


def get_trending_tech_topics(max_items: int = 6) -> str:
    """Retourne les titres des articles tech du moment (Hacker News top stories).
    Échoue silencieusement (retourne "") en cas de problème réseau — le
    calendrier éditorial doit continuer à fonctionner sans cette source."""
    try:
        top_ids_response = requests.get(f"{HN_API_BASE}/topstories.json", timeout=10)
        top_ids_response.raise_for_status()
        top_ids = top_ids_response.json()[:max_items]

        titles = []
        for story_id in top_ids:
            item_response = requests.get(f"{HN_API_BASE}/item/{story_id}.json", timeout=10)
            item = item_response.json()
            if item and item.get("title"):
                titles.append(item["title"])
    except requests.RequestException:
        return ""

    if not titles:
        return ""

    return "Actualités tech du moment :\n" + "\n".join(f"- {t}" for t in titles)
