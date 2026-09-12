# New Project Template

This repository is a duplicate project structure for a FastAPI API and a Next.js frontend, designed to be deployed in the same way as the original app.

## Structure

- `backend/` — FastAPI service for calculation logic
- `frontend/` — Next.js frontend UI
- `app.py` — local Streamlit prototype

## Local development

### API

```bash
cd backend
uv venv
uv pip install -r requirements.txt
uv run uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Deployment

### API (Render)

- Create a new Web Service in Render
- Connect this repo or the backend folder
- Set the start command:

```bash
uv run uvicorn api:app --host 0.0.0.0 --port $PORT
```

- Add environment variables as needed, such as `PORT`

### Frontend (Vercel)

- Import the `frontend` folder into Vercel
- Set the project root to the `frontend` folder
- In production, set `NEXT_PUBLIC_API_URL` to your Render backend URL

Example:

```bash
NEXT_PUBLIC_API_URL=https://your-render-api-url.onrender.com/calculate
```

## Notes

This is a clean scaffold based on the same architecture and styling approach as the original app. Rename the app, update branding text, and swap the logic for your own business rules.
