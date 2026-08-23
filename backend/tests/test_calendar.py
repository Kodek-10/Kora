"""Tests du calendrier éditorial : GET /api/calendar et POST /api/calendar/suggest."""

from datetime import date, timedelta
from unittest.mock import patch

from app.models.post import Post
from app.routes.calendar import _spread_dates


class TestGetCalendar:
    def test_datées_avant_non_datées_et_draft_exclu(self, client, seed_post):
        seed_post(sujet="Idée sans date", statut="idea")
        seed_post(sujet="Planifiée tard", statut="scheduled", date_planifiee=date(2026, 9, 10))
        seed_post(sujet="Planifiée tôt", statut="scheduled", date_planifiee=date(2026, 9, 1))
        seed_post(sujet="Brouillon exclu", statut="draft")

        items = client.get("/api/calendar").json()

        assert [i["sujet"] for i in items] == ["Planifiée tôt", "Planifiée tard", "Idée sans date"]

    def test_vide_au_depart(self, client):
        assert client.get("/api/calendar").json() == []


class TestSpreadDates:
    """Unitaires sur la répartition des dates — logique pure."""

    def test_un_seul_sujet_tombe_en_fin_d_intervalle(self):
        dates = _spread_dates(1, 7)
        assert len(dates) == 1
        assert dates[0] == date.today() + timedelta(days=7)

    def test_toutes_les_dates_dans_l_intervalle(self):
        dates = _spread_dates(5, 14)
        demain = date.today() + timedelta(days=1)
        fin = date.today() + timedelta(days=14)
        assert all(demain <= d <= fin for d in dates)

    def test_plus_de_sujets_que_de_jours_reste_dans_l_intervalle(self):
        dates = _spread_dates(10, 3)  # des doublons possibles, jamais de dépassement
        fin = date.today() + timedelta(days=3)
        assert all(d <= fin for d in dates)


class TestSuggestTopics:
    def test_cree_des_posts_schedulés_répartis(self, client, db_session):
        sujets = ["Sujet A", "Sujet B", "Sujet C"]
        with (
            patch("app.routes.calendar.generate_topic_suggestions", return_value=sujets),
            patch("app.routes.calendar.get_recent_activity_summary", return_value=""),
            patch("app.routes.calendar.get_trending_tech_topics", return_value=""),
        ):
            response = client.post(
                "/api/calendar/suggest",
                json={"theme": "cybersécurité", "nombre": 3, "jours": 10},
            )

        assert response.status_code == 200
        body = response.json()
        assert [b["sujet"] for b in body] == sujets
        assert all(b["statut"] == "scheduled" for b in body)

        demain = date.today() + timedelta(days=1)
        fin = date.today() + timedelta(days=10)
        planned = [date.fromisoformat(b["date_planifiee"]) for b in body]
        assert all(demain <= d <= fin for d in planned)
        assert db_session.query(Post).filter(Post.statut == "scheduled").count() == 3

    def test_fonctionne_meme_si_les_sources_echouent(self, client, monkeypatch):
        """GitHub/HN indisponibles → échouent silencieusement DANS les services
        (contrat : erreur réseau attrapée, retour ""), le calendrier continue."""
        import requests

        def network_down(*args, **kwargs):
            raise requests.RequestException("réseau indisponible")

        # GitHub : le service ne tente l'appel que si un username est configuré.
        monkeypatch.setattr("app.services.github_service.GITHUB_USERNAME", "pseudo-test")
        monkeypatch.setattr("app.services.github_service.requests.get", network_down)
        monkeypatch.setattr("app.services.tech_news_service.requests.get", network_down)

        with patch("app.routes.calendar.generate_topic_suggestions", return_value=["Sujet seul"]):
            response = client.post("/api/calendar/suggest", json={"nombre": 1, "jours": 5})

        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_sources_actives_passent_le_contexte_a_gemini(self, client):
        github_summary = "Activité GitHub récente de l'utilisateur :\n- kora (commits récents)"
        news_summary = "Actualités tech du moment :\n- Une faille zero-day"
        captured = {}

        def fake_suggestions(theme, nombre, context=""):
            captured["context"] = context
            return ["Sujet inspiré"]

        with (
            patch("app.routes.calendar.generate_topic_suggestions", side_effect=fake_suggestions),
            patch("app.routes.calendar.get_recent_activity_summary", return_value=github_summary),
            patch("app.routes.calendar.get_trending_tech_topics", return_value=news_summary),
        ):
            response = client.post("/api/calendar/suggest", json={"nombre": 1, "jours": 5})

        assert response.status_code == 200
        assert github_summary in captured["context"]
        assert news_summary in captured["context"]

    def test_gemini_failure_returns_502(self, client):
        with (
            patch(
                "app.routes.calendar.generate_topic_suggestions",
                side_effect=RuntimeError("Erreur lors de la génération"),
            ),
            patch("app.routes.calendar.get_recent_activity_summary", return_value=""),
            patch("app.routes.calendar.get_trending_tech_topics", return_value=""),
        ):
            response = client.post("/api/calendar/suggest", json={"nombre": 2, "jours": 5})

        assert response.status_code == 502

    def test_validation_nombre_et_jours(self, client):
        for payload in [{"nombre": 0}, {"nombre": 11}, {"jours": 0}, {"jours": 31}]:
            response = client.post("/api/calendar/suggest", json=payload)
            assert response.status_code == 422, f"payload {payload} devrait être rejeté"
