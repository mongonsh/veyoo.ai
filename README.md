# GCP Hack – Monorepo

This repository contains the Veyoo project (frontend + backend microservices + infrastructure).

## Structure
- `Veyoo/` – main project
  - `frontend/` – React SPA (Create React App)
  - `backend/` – FastAPI services (`gateway-service`, `imagen-service`, etc.)
  - `infra/` – Terraform (GKE, VPC) and API Gateway templates
  - `cloudbuild.yaml` – builds and pushes all images
- `run.sh`, `run-local.sh` – helper scripts (if applicable)

For detailed docs, see:
- `Veyoo/README.md` (English)
- `Veyoo/README_ja.md` (日本語)

## Quick Start
- Frontend (local):
```bash
cd Veyoo/frontend
npm ci
npm start
```
- Backend (example gateway-service local):
```bash
cd Veyoo/backend/gateway-service
python -m pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080
```

## Deploy (Cloud Run)
- Deploy gateway:
```bash
export PROJECT_ID=YOUR_PROJECT_ID
export REGION=us-central1

gcloud builds submit Veyoo/backend/gateway-service \
  --tag $REGION-docker.pkg.dev/$PROJECT_ID/veyoo-repo/gateway-service:latest

gcloud run deploy gateway-service \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/veyoo-repo/gateway-service:latest \
  --region $REGION --allow-unauthenticated --port 8080 \
  --set-env-vars GEMINI_API_KEY=YOUR_API_KEY
```
- Deploy frontend (points at gateway):
```bash
export GATEWAY_URL=$(gcloud run services describe gateway-service --region $REGION --format='value(status.url)')

gcloud builds submit Veyoo/frontend \
  --tag $REGION-docker.pkg.dev/$PROJECT_ID/veyoo-repo/frontend:latest \
  -- --build-arg REACT_APP_API_BASE_URL="$GATEWAY_URL"

gcloud run deploy frontend \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/veyoo-repo/frontend:latest \
  --region $REGION --allow-unauthenticated --port 8080
```

## Notes
- Frontend reads `REACT_APP_API_BASE_URL` at build time.
- `gateway-service` exposes `POST /generate-video` and supports calling Vertex AI directly with `GEMINI_API_KEY`, or proxying to `IMAGEN_SERVICE_URL` if set.
- CORS for Vercel domain is enabled in gateway; add more origins as needed.

For GKE/Terraform and Vercel instructions, see `Veyoo/README.md`.
