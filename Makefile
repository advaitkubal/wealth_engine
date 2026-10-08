.PHONY: setup dev test lint typecheck clean help

PYTHON = backend/.venv/bin/python3
PIP    = backend/.venv/bin/pip
PYTEST = backend/.venv/bin/pytest
RUFF   = backend/.venv/bin/ruff
MYPY   = backend/.venv/bin/mypy

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Create venv and install all deps
	python3 -m venv backend/.venv
	$(PIP) install --upgrade pip
	$(PIP) install -r backend/requirements.txt
	$(PIP) install -r backend/requirements-dev.txt
	npm install

dev: ## Start backend + frontend (use two terminals or tmux)
	@echo "Start backend:  cd backend && ../.venv/bin/uvicorn app.main:app --reload --port 8000"
	@echo "Start frontend: npm run dev"

dev-backend: ## Start backend
	backend/.venv/bin/uvicorn app.main:app --reload --port 8000 --app-dir backend

dev-frontend: ## Start frontend
	npm run dev

test: ## Run all backend tests
	$(PYTEST) backend/tests/ -v --tb=short

test-cov: ## Run tests with coverage
	$(PYTEST) backend/tests/ -v --tb=short --cov=backend/app --cov-report=term-missing

lint: ## Run ruff linter
	$(RUFF) check backend/app/ backend/tests/

lint-fix: ## Run ruff linter with auto-fix
	$(RUFF) check --fix backend/app/ backend/tests/

typecheck: ## Run mypy type checker
	$(MYPY) backend/app/ --ignore-missing-imports

typecheck-fe: ## Run TypeScript type checker
	npm run typecheck

clean: ## Remove build artifacts
	find backend -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null; true
	find backend -name "*.pyc" -delete 2>/dev/null; true
	find backend -name ".mypy_cache" -type d -exec rm -rf {} + 2>/dev/null; true
	find backend -name ".ruff_cache" -type d -exec rm -rf {} + 2>/dev/null; true

check: lint typecheck test ## Run all checks (lint + typecheck + test)
