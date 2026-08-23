"""Tests des routes /api/generate-post, /api/history et /api/posts/{id}/status."""

from datetime import datetime
from unittest.mock import patch

from app.models.post import Post

VALID_PAYLOAD = {
    "sujet": "Ce que j'ai appris en construisant un projet IA de A à Z",
    "ton": "professionnel",
    "langue": "fr",
}


class TestGeneratePost:
    def test_success_creates_draft(self, client, db_session):
        fake_result = {
            "post": "Texte du post généré.",
            "hashtags": ["#IA", "#AfricaTech", "#BuildInPublic"],
        }
        with patch("app.routes.posts.generate_post_text", return_value=fake_result):
            response = client.post("/api/generate-post", json=VALID_PAYLOAD)

        assert response.status_code == 200
        body = response.json()
        assert body["post"] == "Texte du post généré."
        assert body["hashtags"] == ["#IA", "#AfricaTech", "#BuildInPublic"]
        # L'URL d'image est construite localement (Pollinations) — jamais d'appel réseau.
        assert body["image_url"].startswith("https://image.pollinations.ai/prompt/")
        assert "width=1200" in body["image_url"]
        assert "nologo=true" in body["image_url"]

        post = db_session.query(Post).filter(Post.id == body["id"]).one()
        assert post.statut == "draft"  # un post généré naît toujours en draft
        assert post.ton == "professionnel"
        assert post.langue == "fr"

    def test_image_prompt_reflects_subject(self, client):
        """Le prompt image dérive du sujet — pas de texte intégré, style sobre."""
        from urllib.parse import quote

        with patch("app.routes.posts.generate_post_text", return_value={"post": "t", "hashtags": []}):
            response = client.post("/api/generate-post", json=VALID_PAYLOAD)

        assert quote(VALID_PAYLOAD["sujet"]) in response.json()["image_url"]

    def test_gemini_failure_returns_502_and_persists_nothing(self, client, db_session):
        with patch(
            "app.routes.posts.generate_post_text",
            side_effect=RuntimeError("Quota Gemini gratuit atteint."),
        ):
            response = client.post("/api/generate-post", json=VALID_PAYLOAD)

        assert response.status_code == 502
        assert "Quota" in response.json()["detail"]
        assert db_session.query(Post).count() == 0  # rien ne persiste en cas d'échec

    def test_sujet_trop_court_rejete(self, client):
        response = client.post("/api/generate-post", json={**VALID_PAYLOAD, "sujet": "court"})
        assert response.status_code == 422

    def test_ton_invalide_rejete(self, client):
        response = client.post("/api/generate-post", json={**VALID_PAYLOAD, "ton": "neutre"})
        assert response.status_code == 422

    def test_langue_invalide_rejete(self, client):
        response = client.post("/api/generate-post", json={**VALID_PAYLOAD, "langue": "es"})
        assert response.status_code == 422


class TestHistory:
    def test_tri_descendant_et_filtre_statut(self, client, seed_post):
        seed_post(sujet="Ancien", created_at=datetime(2026, 8, 1, 10, 0, 0))
        seed_post(sujet="Récent", statut="scheduled", created_at=datetime(2026, 8, 20, 10, 0, 0))

        all_posts = client.get("/api/history").json()
        assert [p["sujet"] for p in all_posts] == ["Récent", "Ancien"]  # plus récents d'abord

        drafts_only = client.get("/api/history", params={"statut": "draft"}).json()
        assert [p["sujet"] for p in drafts_only] == ["Ancien"]

    def test_vide_au_depart(self, client):
        assert client.get("/api/history").json() == []


class TestUpdateStatus:
    def test_changement_de_statut(self, client, seed_post):
        post = seed_post(statut="draft")
        response = client.patch(f"/api/posts/{post.id}/status", json={"statut": "published"})
        assert response.status_code == 200
        assert response.json()["statut"] == "published"

    def test_post_introuvable(self, client):
        response = client.patch("/api/posts/id-inconnu/status", json={"statut": "draft"})
        assert response.status_code == 404

    def test_statut_invalide_rejete(self, client, seed_post):
        post = seed_post()
        response = client.patch(f"/api/posts/{post.id}/status", json={"statut": "archived"})
        assert response.status_code == 422
