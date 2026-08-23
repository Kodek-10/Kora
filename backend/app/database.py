"""Connexion à la base SQLite locale via SQLAlchemy.
Un seul fichier `kora.db` créé automatiquement au premier lancement — aucune
installation de serveur de base de données nécessaire."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import DATABASE_URL

# check_same_thread=False est nécessaire pour SQLite avec FastAPI (accès multi-requêtes),
# sans danger ici puisque SQLAlchemy gère une session par requête.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dépendance FastAPI : fournit une session DB par requête, la ferme après."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Crée les tables si elles n'existent pas encore. Appelé au démarrage de l'app."""
    from app.models import post  # noqa: F401 — importé pour enregistrer le modèle

    Base.metadata.create_all(bind=engine)
