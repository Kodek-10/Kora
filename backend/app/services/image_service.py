"""Service d'appel à l'API d'image (Pollinations.ai par défaut).

Pollinations.ai fonctionne par simple URL — l'image est générée à la volée
quand l'URL est appelée, pas besoin de clé API. On construit juste l'URL
et on la retourne ; le frontend/téléchargement s'en sert directement.
"""

from urllib.parse import quote

from app.config import IMAGE_API_BASE_URL


def build_image_prompt(sujet: str) -> str:
    """Dérive une description visuelle sobre à partir du sujet du post —
    jamais de texte intégré à l'image, style professionnel."""
    return (
        f"professional minimalist illustration representing: {sujet}, "
        f"clean design, tech aesthetic, no text, no words, no letters, "
        f"soft color palette, LinkedIn banner style"
    )


def generate_image_url(sujet: str) -> str:
    """Retourne l'URL de l'image générée. Pollinations.ai génère l'image à
    l'accès de l'URL elle-même (pas d'appel HTTP nécessaire côté backend)."""
    image_prompt = build_image_prompt(sujet)
    encoded_prompt = quote(image_prompt)
    return f"{IMAGE_API_BASE_URL}/{encoded_prompt}?width=1200&height=630&nologo=true"
