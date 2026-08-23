# Kora

Générateur personnel de posts LinkedIn (texte + image), assisté par IA — projet strictement personnel et local, aucune publication ni déploiement public.

## Stack

| Composant | Choix |
|---|---|
| Backend | FastAPI + Uvicorn |
| Base de données | SQLite (fichier local `kora.db`, aucun serveur à gérer) |
| IA texte | Gemini 3.6 Flash (sortie JSON structurée) |
| IA image | Pollinations.ai |
| Frontend | React + Vite + Tailwind CSS |

Voir [`docs/SETUP.md`](./docs/SETUP.md) pour les décisions de conception détaillées.

## Lancer le projet en local

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows : venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Éditer .env et renseigner ta clé GEMINI_API_KEY (Google AI Studio, gratuit)
uvicorn app.main:app --reload
```

Backend disponible sur `http://localhost:8000` — documentation interactive sur `http://localhost:8000/docs`.

### 2. Frontend

Dans un second terminal :

```bash
cd frontend
npm install
npm run dev
```

Frontend disponible sur `http://localhost:5173`.

### 3. Utilisation

Ouvre `http://localhost:5173`, génère tes posts, relis-les dans le champ éditable, copie le texte et télécharge l'image, puis publie toi-même sur LinkedIn.

## Variables d'environnement

Voir [`backend/.env.example`](./backend/.env.example) pour la liste complète.

## Ce que Kora ne fait pas

- Ne publie jamais automatiquement sur LinkedIn.
- N'est pas déployé publiquement — usage local uniquement, une seule personne (toi).
