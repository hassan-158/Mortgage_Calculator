# Backend service

## Run locally

```bash
uv run uvicorn backend.api:app --reload
```

## Render deployment

Use a Render Web Service with the following start command:

```bash
uv run uvicorn api:app --host 0.0.0.0 --port $PORT
```

The app is designed to expose a `POST /calculate` endpoint.
