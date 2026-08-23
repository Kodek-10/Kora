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


class TestUpdatePost:
    """PATCH /api/posts/{id} — édition du contenu, jamais du statut."""

    def test_edition_partielle_ne_touche_que_le_champ_fourni(self, client, seed_post):
        post = seed_post(sujet="Sujet original suffisamment long", post="Texte initial")

        response = client.patch(f"/api/posts/{post.id}", json={"post": "Texte relu et corrigé."})

        assert response.status_code == 200
        body = response.json()
        assert body["post"] == "Texte relu et corrigé."
        assert body["sujet"] == "Sujet original suffisamment long"  # inchangé

    def test_hashtags_nettoyés(self, client, seed_post):
        post = seed_post()
        response = client.patch(
            f"/api/posts/{post.id}",
            json={"hashtags": ["#IA ", "", "  #AfricaTech", " "]},
        )
        assert response.status_code == 200
        # Espaces retirés, entrées vides supprimées
        assert response.json()["hashtags"] == ["#IA", "#AfricaTech"]

    def test_vidage_explicite_d_un_champ(self, client, seed_post):
        from datetime import date

        post = seed_post(post="Texte", date_planifiee=date(2026, 9, 1))
        response = client.patch(f"/api/posts/{post.id}", json={"post": None, "date_planifiee": None})
        assert response.status_code == 200
        body = response.json()
        assert body["post"] is None
        assert body["date_planifiee"] is None

    def test_statut_refusé_via_cette_route(self, client, seed_post):
        """Le statut a sa route dédiée : tenter de le passer ici est refusé
        (extra=forbid) plutôt que silencieusement ignoré."""
        post = seed_post(statut="draft")
        response = client.patch(f"/api/posts/{post.id}", json={"statut": "published"})
        assert response.status_code == 422

    def test_sujet_trop_court_rejeté(self, client, seed_post):
        post = seed_post()
        response = client.patch(f"/api/posts/{post.id}", json={"sujet": "court"})
        assert response.status_code == 422

    def test_aucun_champ_fourni_rejeté(self, client, seed_post):
        post = seed_post()
        response = client.patch(f"/api/posts/{post.id}", json={})
        assert response.status_code == 400

    def test_post_introuvable(self, client):
        response = client.patch("/api/posts/id-inconnu", json={"post": "Texte"})
        assert response.status_code == 404


class TestRegenerateImage:
    """POST /api/posts/{id}/regenerate-image — zéro quota Gemini consommé."""

    def test_nouvelle_url_avec_seed(self, client, seed_post):
        post = seed_post(sujet="Sujet de départ pour le visuel")
        old_url = post.image_url

        response = client.post(f"/api/posts/{post.id}/regenerate-image")

        assert response.status_code == 200
        new_url = response.json()["image_url"]
        assert new_url != old_url  # le seed rend la régénération réelle
        assert "seed=" in new_url

    def test_utilise_le_sujet_après_édition(self, client, seed_post):
        post = seed_post(sujet="Sujet initial du post")
        client.patch(f"/api/posts/{post.id}", json={"sujet": "Sujet modifié avant régénération"})

        response = client.post(f"/api/posts/{post.id}/regenerate-image")

        from urllib.parse import quote

        assert quote("Sujet modifié avant régénération") in response.json()["image_url"]

    def test_gemini_jamais_appelé(self, client, seed_post):
        """Garantie structurelle : la route ne dépend pas du service Gemini.
        On le vérifie en cassant Gemini volontairement — la régénération
        doit quand même réussir."""
        with patch("app.routes.posts.generate_post_text", side_effect=RuntimeError("quota")):
            post = seed_post()
            response = client.post(f"/api/posts/{post.id}/regenerate-image")
        assert response.status_code == 200

    def test_post_introuvable(self, client):
        response = client.post("/api/posts/id-inconnu/regenerate-image")
        assert response.status_code == 404
