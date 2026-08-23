"""Configuration centralisée — toutes les clés/valeurs sensibles passent par ici,
jamais codées en dur ailleurs dans le code."""

import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# Pollinations.ai ne nécessite pas de clé, mais l'URL de base reste configurable
# au cas où tu changes de service d'image plus tard sans réécrire le code.
IMAGE_API_BASE_URL = os.getenv("IMAGE_API_BASE_URL", "https://image.pollinations.ai/prompt")

# SQLite local — un seul fichier, pas de serveur de base de données à gérer.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kora.db")

# Projet strictement personnel et local : pas d'auth, pas de CORS multi-domaine.
# Si tu changes d'avis un jour et déploies Kora, c'est ici qu'il faudra ajouter
# une vérification de clé API et restreindre CORS_ORIGINS à ton vrai domaine.
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

# GitHub — utilisé pour nourrir les suggestions du calendrier éditorial avec
# ton activité publique réelle. GITHUB_TOKEN est optionnel : sans lui, l'API
# GitHub limite à 60 requêtes/heure (largement suffisant en usage personnel
# occasionnel) ; avec un token personnel (lecture seule, scope "public_repo"
# ou aucun scope pour du public uniquement), la limite monte à 5000/heure.
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME", "")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY manquant. Copie .env.example vers .env et renseigne ta clé "
        "(Google AI Studio, tier gratuit, aucune carte bancaire requise)."
    )
