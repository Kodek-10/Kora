"""Modèle canonique d'un post — équivalent SQLite du schéma SQL défini dans le
cahier des charges (à l'origine pensé pour PostgreSQL/Supabase)."""

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, Date, DateTime
from sqlalchemy.types import JSON

from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Post(Base):
    __tablename__ = "posts"

    id = Column(String, primary_key=True, default=generate_uuid)
    sujet = Column(String(500), nullable=False)
    post = Column(Text, nullable=True)
    hashtags = Column(JSON, nullable=True)          # liste de chaînes, ex: ["#AI", "#AfricaTech"]
    image_url = Column(Text, nullable=True)
    ton = Column(String(50), default="décontracté")
    langue = Column(String(10), default="fr")
    statut = Column(String(20), default="draft")     # idea | draft | scheduled | published
    date_planifiee = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Note : pas de colonne user_id pour l'instant — projet strictement personnel.
    # Si tu changes d'avis un jour, l'ajouter ici en nullable coûte une migration
    # légère plutôt qu'une refonte du schéma.
