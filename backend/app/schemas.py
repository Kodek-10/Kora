"""Schémas Pydantic — validation automatique des entrées/sorties API.
Séparés du modèle SQLAlchemy pour ne jamais exposer directement la structure
de la base de données au frontend."""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class GeneratePostRequest(BaseModel):
    sujet: str = Field(..., min_length=10, max_length=500)
    ton: str = Field(default="décontracté", pattern="^(décontracté|professionnel|inspirant)$")
    langue: str = Field(default="fr", pattern="^(fr|en)$")


class GeneratePostResponse(BaseModel):
    id: str
    post: str
    hashtags: list[str]
    image_url: Optional[str] = None


class PostOut(BaseModel):
    id: str
    sujet: str
    post: Optional[str]
    hashtags: Optional[list[str]]
    image_url: Optional[str]
    ton: str
    langue: str
    statut: str
    date_planifiee: Optional[date]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UpdateStatusRequest(BaseModel):
    statut: str = Field(..., pattern="^(idea|draft|scheduled|published)$")


class SuggestRequest(BaseModel):
    theme: Optional[str] = None
    nombre: int = Field(default=5, ge=1, le=10)
    jours: int = Field(
        default=7, ge=1, le=30,
        description="Étale les suggestions sur cet intervalle de jours à partir de demain."
    )
    inclure_github: bool = Field(
        default=True, description="Utiliser l'activité GitHub récente comme inspiration."
    )
    inclure_actualites: bool = Field(
        default=True, description="Utiliser l'actualité tech du moment comme inspiration."
    )


class SuggestionOut(BaseModel):
    sujet: str
