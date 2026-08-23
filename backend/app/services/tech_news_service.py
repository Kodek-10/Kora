"""Service de récupération de sujets d'actualité tech récents, via l'API
publique de Hacker News (gratuite, aucune clé requise) — utilisé comme
contexte pour inspirer les suggestions de sujets de posts.

Les titres des articles sont récupérés en parallèle (ThreadPoolExecutor) :
la source est optionnelle, mais quand elle répond, elle doit répondre vite.
L'ordre d'affichage suit celui du top stories, indépendamment de l'ordre
d'arrivée des réponses.
"""

import logging
from concurrent.futures import ThreadPoolExecutor

import requests

HN_API_BASE = "https://hacker-news.firebaseio.com/v0"

logger = logging.getLogger(__name__)


def _fetch_title(story_id: int) -> str | None:
    """Récupère le titre d'un article. Retourne None si cet article précis
    échoue (réseau, article supprimé entre-temps) — il sera simplement absent
    de la liste, sans casser les autres."""
    try:
        item_response = requests.get(f"{HN_API_BASE}/item/{story_id}.json", timeout=10)
        item = item_response.json()
        return item.get("title") if item else None
    except Exception:
        # Source optionnelle : tout problème sur UN article ne doit jamais
        # faire planter le calendrier éditorial.
        logger.warning("Article Hacker News %s illisible — ignoré.", story_id)
        return None


def get_trending_tech_topics(max_items: int = 6) -> str:
    """Retourne les titres des articles tech du moment (Hacker News top stories).
    Échoue silencieusement (retourne "") en cas de problème réseau — le
    calendrier éditorial doit continuer à fonctionner sans cette source."""
    try:
        top_ids_response = requests.get(f"{HN_API_BASE}/topstories.json", timeout=10)
        top_ids_response.raise_for_status()
        top_ids = top_ids_response.json()[:max_items]
    except Exception:
        # Idem : toute erreur (réseau, format inattendu) → pas d'actualités,
        # le calendrier continue sans ce contexte.
        logger.warning("Source Hacker News indisponible pour les suggestions — ignorée.")
        return ""

    if not top_ids:
        return ""

    # executor.map préserve l'ordre des entrées quel que soit l'ordre
    # d'arrivée des threads.
    with ThreadPoolExecutor(max_workers=min(len(top_ids), 6)) as executor:
        titles = [t for t in executor.map(_fetch_title, top_ids) if t]

    if not titles:
        return ""

    return "Actualités tech du moment :\n" + "\n".join(f"- {t}" for t in titles)
