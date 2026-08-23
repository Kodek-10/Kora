# Kora — commandes de développement local
.PHONY: install run-backend run-frontend test lint format check

install:            ## Première installation (backend + frontend)
	cd backend && python3 -m venv venv && ./venv/bin/pip install -r requirements.txt -r requirements-dev.txt
	cd frontend && npm install

run-backend:        ## Lance l'API sur http://localhost:8000 (docs sur /docs)
	cd backend && ./venv/bin/uvicorn app.main:app --reload

run-frontend:       ## Lance le frontend sur http://localhost:5173
	cd frontend && npm run dev

test:               ## Suite de tests backend (aucun appel réseau)
	cd backend && ./venv/bin/python -m pytest

lint:               ## Vérification statique (ruff)
	cd backend && ./venv/bin/ruff check .

format:             ## Formatage automatique (ruff)
	cd backend && ./venv/bin/ruff format .

check: lint test    ## Tout ce qui doit passer avant un commit
