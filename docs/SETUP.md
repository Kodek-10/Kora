# Décisions de conception — version personnelle et locale

Ce document explique les écarts entre le cahier des charges initial (pensé pour un déploiement cloud) et cette version, recentrée sur un usage strictement personnel et local.

## Ce qui a changé par rapport au cahier des charges initial

| Aspect | Cahier des charges initial | Cette version | Raison |
|---|---|---|---|
| Base de données | Supabase (PostgreSQL cloud) | SQLite (fichier local) | Pas besoin de synchronisation multi-appareils ni de serveur — un fichier suffit, sauvegarde = copier le fichier |
| Déploiement | Railway/Render + Vercel/Netlify | Aucun — exécution locale (`uvicorn` + `npm run dev`) | Usage personnel exclusif, pas de besoin d'accès distant |
| Authentification | Non requise (mais app publique) | Non requise, et cohérent cette fois — l'app n'est jamais exposée | En local, seul toi peux atteindre l'API |
| CORS | Restreint au domaine de prod | Restreint à `localhost:5173` | Reflète l'environnement réel |
| Sortie Gemini | Texte libre parsé | JSON structuré forcé (`response_schema`) | Évite les ruptures de parsing d'un appel à l'autre — recommandation appliquée dès cette version |
| Relecture avant copie | Non spécifiée | Champ texte éditable obligatoire avant "Copier" | Réduit le risque de publier une hallucination technique sous ton nom sans relecture |
| Suggestions du calendrier | Sujets génériques uniquement | Ancrées dans ton activité GitHub réelle + actualité tech du moment, avec dates réparties sur un intervalle choisi | Le calendrier propose des sujets pertinents et actuels sans que tu aies à chercher l'inspiration toi-même |

## Ce qui reste identique

- Le prompt de style (persona Israel NKUNA) — inchangé, défini dans `backend/app/services/gemini_service.py`.
- Le schéma conceptuel des données (`sujet`, `post`, `hashtags`, `image_url`, `ton`, `langue`, `statut`, `date_planifiee`) — juste porté de PostgreSQL vers SQLite.
- Les quatre statuts du cycle de vie d'un post : `idea` → `draft` → `scheduled` → `published`.
- Le principe central : aucune publication automatique, contrôle humain total avant diffusion.

## Suggestions automatiques (GitHub + actualité tech)

Le calendrier éditorial peut proposer des sujets sans que tu aies à réfléchir toi-même à quoi parler :

- **Activité GitHub** (`app/services/github_service.py`) : récupère tes événements publics récents (commits, dépôts créés, pull requests) via l'API GitHub, et les donne comme contexte à Gemini. Configure `GITHUB_USERNAME` dans `.env` pour l'activer — `GITHUB_TOKEN` est optionnel mais recommandé si tu génères des suggestions souvent (limite de 60 requêtes/heure sans token, 5000/heure avec).
- **Actualité tech** (`app/services/tech_news_service.py`) : récupère les titres tendance de Hacker News (aucune clé requise), donnés comme contexte à Gemini.

Les deux sources sont activables/désactivables indépendamment depuis l'interface (cases à cocher dans le calendrier éditorial). Si une source échoue (réseau, GitHub down) ou n'est pas configurée, elle est simplement ignorée — le calendrier continue de fonctionner sans planter.

Le prompt demande explicitement à Gemini de s'inspirer du contexte réel sans inventer de détails absents de celui-ci, pour éviter qu'il invente des faits sur des projets qui n'existent pas.

## Si tu changes d'avis un jour (déploiement futur)

Si tu décides plus tard d'héberger Kora pour y accéder depuis ton téléphone, par exemple :
1. Remplacer `DATABASE_URL` par une URL PostgreSQL (Supabase ou autre) — le code SQLAlchemy ne change pas, seule la chaîne de connexion change.
2. Ajouter une vérification de clé API simple dans `app/main.py` (middleware ou dépendance FastAPI) avant d'exposer l'API publiquement.
3. Mettre à jour `CORS_ORIGINS` dans `.env` avec le vrai domaine de production.
4. Ajouter une colonne `user_id` si tu veux un jour ouvrir l'app à d'autres personnes.

Aucune de ces étapes ne nécessite de réécrire l'architecture actuelle — c'est volontairement conçu pour rester extensible sans refonte.
