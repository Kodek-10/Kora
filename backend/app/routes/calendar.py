"""Routes liées au calendrier éditorial (suggestions de sujets à l'avance,
réparties sur un intervalle de jours)."""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.post import Post
from app.schemas import SuggestRequest
from app.services.gemini_service import generate_topic_suggestions
from app.services.github_service import get_recent_activity_summary
from app.services.tech_news_service import get_trending_tech_topics

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("")
def get_calendar(db: Session = Depends(get_db)):
    """Retourne les posts en statut 'idea' ou 'scheduled' — la vue calendrier,
    triée par date planifiée (les non-datées en dernier)."""
    return db.query(Post).filter(Post.statut.in_(["idea", "scheduled"])).order_by(
        Post.date_planifiee.is_(None), Post.date_planifiee.asc()
    ).all()


def _spread_dates(nombre: int, jours: int) -> list[date]:
    """Répartit `nombre` dates aussi régulièrement que possible sur les `jours`
    prochains jours (à partir de demain). Si nombre > jours, plusieurs posts
    peuvent tomber le même jour plutôt que de dépasser l'intervalle demandé."""
    today = date.today()
    if nombre == 1:
        return [today + timedelta(days=jours)]
    dates = []
    for i in range(nombre):
        # Répartition linéaire entre jour 1 et jour `jours` inclus.
        offset = round(1 + i * (jours - 1) / (nombre - 1)) if jours > 1 else 1
        dates.append(today + timedelta(days=offset))
    return dates


@router.post("/suggest")
def suggest_topics(payload: SuggestRequest, db: Session = Depends(get_db)):
    """Génère des sujets, en s'inspirant de l'activité GitHub réelle et/ou de
    l'actualité tech si activé, les répartit sur l'intervalle demandé
    (`jours`), et les enregistre en statut 'scheduled' avec une date_planifiee
    — prêts à être développés en post complet en un clic depuis le frontend."""
    context_parts = []
    if payload.inclure_github:
        github_summary = get_recent_activity_summary()
        if github_summary:
            context_parts.append(github_summary)
    if payload.inclure_actualites:
        news_summary = get_trending_tech_topics()
        if news_summary:
            context_parts.append(news_summary)
    context = "\n\n".join(context_parts)

    try:
        sujets = generate_topic_suggestions(payload.theme, payload.nombre, context=context)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    dates = _spread_dates(len(sujets), payload.jours)

    created = []
    for sujet, planned_date in zip(sujets, dates):
        post = Post(sujet=sujet, statut="scheduled", date_planifiee=planned_date)
        db.add(post)
        created.append(post)
    db.commit()
    for post in created:
        db.refresh(post)

    return [
        {"id": p.id, "sujet": p.sujet, "statut": p.statut, "date_planifiee": p.date_planifiee}
        for p in created
    ]
