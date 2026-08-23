"""Point d'entrée de l'application Kora.

Usage local uniquement : lancer avec `uvicorn app.main:app --reload`
et ouvrir http://localhost:8000/docs pour tester les routes manuellement.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.database import init_db
from app.routes import posts, calendar

app = FastAPI(
    title="Kora",
    description="Générateur personnel de posts LinkedIn — usage strictement local et personnel.",
    version="0.1.0",
)

# CORS restreint au frontend local (localhost:5173 par défaut avec Vite).
# Suffisant ici puisque l'app n'est jamais exposée publiquement.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(posts.router)
app.include_router(calendar.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {"status": "Kora backend actif", "docs": "/docs"}
