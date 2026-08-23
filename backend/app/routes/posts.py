"""Routes liées à la génération, l'historique et le statut des posts."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.post import Post
from app.schemas import GeneratePostRequest, GeneratePostResponse, PostOut, UpdateStatusRequest
from app.services.gemini_service import generate_post_text
from app.services.image_service import generate_image_url

router = APIRouter(prefix="/api", tags=["posts"])


@router.post("/generate-post", response_model=GeneratePostResponse)
def generate_post(payload: GeneratePostRequest, db: Session = Depends(get_db)):
    try:
        result = generate_post_text(payload.sujet, payload.ton, payload.langue)
        image_url = generate_image_url(payload.sujet)
    except RuntimeError as e:
        # Message clair renvoyé au frontend plutôt qu'un plantage silencieux
        # (recommandation de la section risques du cahier des charges).
        raise HTTPException(status_code=502, detail=str(e))

    post = Post(
        sujet=payload.sujet,
        post=result["post"],
        hashtags=result["hashtags"],
        image_url=image_url,
        ton=payload.ton,
        langue=payload.langue,
        statut="draft",
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    return GeneratePostResponse(
        id=post.id, post=post.post, hashtags=post.hashtags, image_url=post.image_url
    )


@router.get("/history", response_model=list[PostOut])
def get_history(statut: Optional[str] = Query(default=None), db: Session = Depends(get_db)):
    query = db.query(Post).order_by(Post.created_at.desc())
    if statut:
        query = query.filter(Post.statut == statut)
    return query.all()


@router.patch("/posts/{post_id}/status", response_model=PostOut)
def update_status(post_id: str, payload: UpdateStatusRequest, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post introuvable")
    post.statut = payload.statut
    db.commit()
    db.refresh(post)
    return post
