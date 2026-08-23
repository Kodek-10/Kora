"""Configuration globale des tests Kora.

Principes :
- Aucun appel réseau réel : les services externes (Gemini, GitHub, Hacker News)
  sont toujours mockés au niveau des routes.
- Base de données isolée : un moteur SQLite en mémoire par test, la vraie
  base `kora.db` n'est jamais touchée.
- La clé Gemini est factice : le client est instancié à l'import mais jamais
  appelé réellement.
"""

import os

# À définir AVANT tout import de l'application : config.py exige cette clé
# et plante sinon. Valeur factice suffisante puisque jamais utilisée en réseau.
os.environ.setdefault("GEMINI_API_KEY", "test-key-factice")
# Le moteur par défaut ne doit jamais être connecté (init_db neutralisé +
# get_db surchargé ci-dessous) ; on le pointe vers la mémoire par précaution.
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.post import Post


@pytest.fixture()
def db_engine(monkeypatch):
    # Neutralise init_db appelé au démarrage de l'app : sans cela, TestClient
    # créerait les tables dans le vrai fichier kora.db du répertoire courant.
    monkeypatch.setattr("app.main.init_db", lambda: None)

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def db_session(db_engine):
    session = sessionmaker(bind=db_engine)()
    yield session
    session.close()


@pytest.fixture()
def client(db_engine):
    """Client FastAPI avec get_db surchargé vers la base de test en mémoire."""

    TestingSession = sessionmaker(bind=db_engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def seed_post(db_session):
    """Fabrique un post avec des valeurs par défaut surchargeables.

    Exemple : post = seed_post(statut="scheduled", date_planifiee=date(2026, 9, 1))
    """

    def _seed(**overrides):
        defaults = dict(sujet="Sujet de test par défaut", statut="draft")
        defaults.update(overrides)
        post = Post(**defaults)
        db_session.add(post)
        db_session.commit()
        db_session.refresh(post)
        return post

    return _seed
