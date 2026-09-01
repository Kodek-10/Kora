"""Service d'appel à l'API Gemini — génère le texte du post et les hashtags.

Applique la recommandation de sortie structurée : on force Gemini à répondre
en JSON conforme à un schéma plutôt que de parser du texte libre, ce qui évite
les ruptures de parsing d'un appel à l'autre.
"""

import json
import logging
import time

from google import genai
from google.genai import types

from app.config import GEMINI_API_KEY, GEMINI_MODEL

logger = logging.getLogger(__name__)

client = genai.Client(api_key=GEMINI_API_KEY)

STYLE_PROMPT = """Tu es Israel NKUNA, 20 ans, étudiant en informatique au Burkina Institute
of Technology (BIT) à Ouagadougou. Congolais d'origine, passionné de tech.

STYLE : jeune et décontracté, accessible, passionné IA et cybersécurité,
met en avant la qualité de la tech africaine, emploie des émojis avec
mesure, s'adresse directement au lecteur, termine par une question
engageante.

STRUCTURE : ouverture → passions → ce que je fais → motivation →
vision Afrique → pourquoi LinkedIn → question → contact.

LONGUEUR : 300 à 500 mots, 5 à 8 paragraphes.

SUJET : {sujet}
TON : {ton}
LANGUE : {langue}

Réponds uniquement avec un objet JSON valide, sans texte avant ou après,
au format : {{"post": "texte complet du post, sans les hashtags à l'intérieur",
"hashtags": ["#Exemple1", "#Exemple2", "#Exemple3"]}}
Fournis entre 3 et 5 hashtags pertinents, jamais plus."""

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "post": {"type": "string"},
        "hashtags": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 3,
            "maxItems": 5,
        },
    },
    "required": ["post", "hashtags"],
}


def generate_post_text(sujet: str, ton: str, langue: str, max_retries: int = 2) -> dict:
    """Appelle Gemini avec sortie JSON forcée. Retente automatiquement en cas de
    quota atteint (429) ou de surcharge temporaire (503), avec un court délai."""
    prompt = STYLE_PROMPT.format(sujet=sujet, ton=ton, langue=langue)
    # Modèle principal + fallback stable (3.5-flash est actuellement moins surchargé que 3.6)
    fallback_model = "gemini-3.5-flash"

    for attempt in range(max_retries + 1):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=RESPONSE_SCHEMA,
                ),
            )
            data = json.loads(response.text)
            data["hashtags"] = data.get("hashtags", [])[:5]
            return data
        except Exception as e:
            msg = str(e)
            is_quota_error = "429" in msg or "RESOURCE_EXHAUSTED" in msg
            is_overload = "503" in msg or "UNAVAILABLE" in msg or "overloaded" in msg.lower()
            if (is_quota_error or is_overload) and attempt < max_retries:
                wait = 2 * (attempt + 1)
                logger.warning(
                    "%s Gemini (%s), nouvelle tentative dans %ss…",
                    "Quota" if is_quota_error else "Surcharge",
                    GEMINI_MODEL,
                    wait,
                )
                time.sleep(wait)
                continue
            if is_quota_error:
                raise RuntimeError(
                    "Quota Gemini gratuit atteint. Réessaie dans quelques minutes, "
                    "ou passe temporairement à un modèle plus léger."
                ) from e
            if is_overload:
                # Dernier recours : essayer le fallback 3.5-flash une fois
                if GEMINI_MODEL != fallback_model:
                    try:
                        logger.warning("Modèle %s surchargé, bascule vers %s…", GEMINI_MODEL, fallback_model)
                        response = client.models.generate_content(
                            model=fallback_model,
                            contents=prompt,
                            config=types.GenerateContentConfig(
                                response_mime_type="application/json",
                                response_schema=RESPONSE_SCHEMA,
                            ),
                        )
                        data = json.loads(response.text)
                        data["hashtags"] = data.get("hashtags", [])[:5]
                        return data
                    except Exception as fe:
                        logger.warning("Fallback %s a échoué : %s", fallback_model, fe)
                raise RuntimeError(
                    "Modèle Gemini temporairement surchargé (503). Réessaie dans 10-20s, "
                    "ou change GEMINI_MODEL en gemini-3.5-flash dans .env (plus stable)."
                ) from e
            logger.warning("Échec de l'appel Gemini : %s", e)
            raise RuntimeError(f"Erreur lors de la génération du texte : {e}") from e


def generate_topic_suggestions(theme: str | None, nombre: int, context: str = "") -> list[str]:
    """Génère une liste de sujets de posts (pas de texte complet) pour le
    calendrier éditorial — appel IA plus court et moins coûteux en quota.

    `context` (optionnel) : activité GitHub récente et/ou actualités tech,
    fournies par le backend pour ancrer les suggestions dans des faits réels
    plutôt que des idées génériques. Le prompt demande explicitement à
    s'en inspirer sans inventer de détails non présents dans le contexte."""
    theme_clause = f"sur le thème général : {theme}" if theme else "variés, dans l'esprit du profil défini"
    context_block = (
        f"\n\nContexte réel à utiliser comme inspiration (ne pas inventer de détails "
        f"absents de cette liste, rester factuel si tu t'y réfères) :\n{context}\n"
        if context
        else ""
    )
    prompt = f"""Propose {nombre} sujets de posts LinkedIn courts et concrets {theme_clause},
pour un étudiant en informatique passionné d'IA et de cybersécurité, orienté tech africaine.
{context_block}
Si le contexte fourni mentionne des dépôts GitHub ou des actualités précises, privilégie
des sujets qui s'en inspirent directement (ex: "ce que j'ai appris en travaillant sur X",
"pourquoi telle actualité tech mérite qu'on s'y intéresse") plutôt que des sujets génériques.
S'il n'y a pas de contexte, propose des sujets variés et intemporels.

Réponds uniquement avec un objet JSON : {{"sujets": ["sujet 1", "sujet 2", ...]}}"""

    # Même logique de fallback pour les suggestions
    fallback_model = "gemini-3.5-flash"
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "object",
                    "properties": {"sujets": {"type": "array", "items": {"type": "string"}}},
                    "required": ["sujets"],
                },
            ),
        )
        return json.loads(response.text)["sujets"][:nombre]
    except Exception as e:
        msg = str(e)
        is_overload = "503" in msg or "UNAVAILABLE" in msg
        if is_overload and GEMINI_MODEL != fallback_model:
            try:
                logger.warning("Suggest surchargé (%s), fallback %s…", GEMINI_MODEL, fallback_model)
                response = client.models.generate_content(
                    model=fallback_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema={
                            "type": "object",
                            "properties": {"sujets": {"type": "array", "items": {"type": "string"}}},
                            "required": ["sujets"],
                        },
                    ),
                )
                return json.loads(response.text)["sujets"][:nombre]
            except Exception:
                pass
        raise
