# Codex Test

Small Django app with a simple PR dashboard to exercise PR review workflows.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Open http://localhost:8000/ to see the dashboard. The page renders a few sample PRs server-side, can refresh them from a tiny JSON endpoint, and lets you capture quick review notes in the browser.
