"""Tests unitaires des services optionnels (GitHub, Hacker News).

Contrat vérifié : ces sources ne doivent JAMAIS faire planter le calendrier
éditorial — tout échec (réseau, format inattendu, bug ponctuel) se traduit
par un retour vide, pas une exception.
"""

from app.services.github_service import get_recent_activity_summary
from app.services.tech_news_service import get_trending_tech_topics


class FakeResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self._payload


class TestTechNews:
    def test_ordre_des_titres_conservé_en_parallèle(self, monkeypatch):
        """Les 6 requêtes partent en parallèle mais l'ordre du top stories
        doit être respecté dans la sortie."""

        def fake_get(url, timeout=10):
            if url.endswith("topstories.json"):
                return FakeResponse([101, 102, 103])
            return FakeResponse({"title": f"Titre {url.split('/')[-1].split('.')[0]}"})

        monkeypatch.setattr("app.services.tech_news_service.requests.get", fake_get)

        result = get_trending_tech_topics()
        assert result == ("Actualités tech du moment :\n- Titre 101\n- Titre 102\n- Titre 103")

    def test_un_article_en_échec_n_emporte_pas_les_autres(self, monkeypatch):
        calls = {"count": 0}

        def fake_get(url, timeout=10):
            if url.endswith("topstories.json"):
                return FakeResponse([1, 2, 3])
            calls["count"] += 1
            if url.endswith("/item/2.json"):
                raise ConnectionError("article illisible")  # erreur NON réseau
            return FakeResponse({"title": f"Titre {url.split('/')[-1].split('.')[0]}"})

        monkeypatch.setattr("app.services.tech_news_service.requests.get", fake_get)
        result = get_trending_tech_topics()

        assert "- Titre 1" in result and "- Titre 3" in result
        assert "Titre 2" not in result

    def test_topstories_inaccessible_retourne_vide(self, monkeypatch):
        def fake_get(url, timeout=10):
            raise ConnectionError("HN down")

        monkeypatch.setattr("app.services.tech_news_service.requests.get", fake_get)
        assert get_trending_tech_topics() == ""

    def test_réponse_vide_retourne_vide(self, monkeypatch):
        monkeypatch.setattr(
            "app.services.tech_news_service.requests.get",
            lambda url, timeout=10: FakeResponse([]),
        )
        assert get_trending_tech_topics() == ""


class TestGitHubService:
    def test_exception_non_réseau_retourne_vide(self, monkeypatch):
        """Élargissement de la résilience : même un bug inattendu (format,
        décodage JSON…) ne doit pas remonter — contrat SETUP.md."""
        monkeypatch.setattr("app.services.github_service.GITHUB_USERNAME", "pseudo-test")

        def boom(url, **kwargs):
            raise RuntimeError("réponse illisible")

        monkeypatch.setattr("app.services.github_service.requests.get", boom)
        assert get_recent_activity_summary() == ""

    def test_sans_username_configuré_aucun_appel_http(self, monkeypatch):
        monkeypatch.setattr("app.services.github_service.GITHUB_USERNAME", "")
        called = False

        def unexpected_call(*args, **kwargs):
            nonlocal called
            called = True
            return FakeResponse([])

        monkeypatch.setattr("app.services.github_service.requests.get", unexpected_call)
        assert get_recent_activity_summary() == ""
        assert called is False

    def test_résumé_liste_les_dépôts_dédupliqués(self, monkeypatch):
        events = [
            {"type": "PushEvent", "repo": {"name": "user/kora"}},
            {"type": "PushEvent", "repo": {"name": "user/kora"}},  # doublon ignoré
            {"type": "PullRequestEvent", "repo": {"name": "user/sika"}},
            {"type": "WatchEvent", "repo": {"name": "user/autre"}},  # type non suivi
        ]
        monkeypatch.setattr("app.services.github_service.GITHUB_USERNAME", "pseudo-test")
        monkeypatch.setattr(
            "app.services.github_service.requests.get",
            lambda url, **kwargs: FakeResponse(events),
        )

        result = get_recent_activity_summary()

        assert result == (
            "Activité GitHub récente de l'utilisateur :\n"
            "- user/kora (commits récents)\n"
            "- user/sika (pull request)"
        )
