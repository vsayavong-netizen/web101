.PHONY: help install install-dev test lint format clean run migrate makemigrations shell superuser

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install production dependencies
	pip install -r requirements.txt

install-dev: ## Install development dependencies
	pip install -r requirements-dev.txt

test: ## Run tests
	python manage.py test

lint: ## Run linting
	flake8 .
	mypy .

format: ## Format code
	black .
	isort .

clean: ## Clean up temporary files
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/
	rm -rf dist/
	rm -rf .coverage
	rm -rf htmlcov/
	rm -rf .pytest_cache/

run: ## Run development server
	python manage.py runserver

migrate: ## Apply database migrations
	python manage.py migrate

makemigrations: ## Create database migrations
	python manage.py makemigrations

shell: ## Open Django shell
	python manage.py shell

superuser: ## Create superuser
	python manage.py createsuperuser

collectstatic: ## Collect static files
	python manage.py collectstatic --noinput

loaddata: ## Load initial data
	python manage.py loaddata fixtures/initial_data.json

dumpdata: ## Dump data to fixtures
	python manage.py dumpdata --indent 2 > fixtures/initial_data.json

docker-build: ## Build Docker image
	docker build -t final-project-management .

docker-run: ## Run with Docker Compose
	docker-compose up -d

docker-stop: ## Stop Docker Compose
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-shell: ## Open shell in Docker container
	docker-compose exec web python manage.py shell

docker-migrate: ## Run migrations in Docker
	docker-compose exec web python manage.py migrate

docker-superuser: ## Create superuser in Docker
	docker-compose exec web python manage.py createsuperuser
