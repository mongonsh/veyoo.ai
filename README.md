# About Veyoo.AI

私は教育テック分野で働きながら、キャリアシフトを考える学生やギャップイヤーを経験した学生に指導する機会がありました。その中で気づいたのは、多くの学生が「自分に本当に合った職業は何か？」に強い不安を抱えているということです。情報はインターネットや学校から得られるものの、実際の職場や仕事のイメージを掴むことが難しく、将来を選ぶ上で大きな壁になっています。
この課題を解決するために、AIを活用して「未来の職場を体験できるプラットフォーム」を作りたいと考えました。Veyoo は教育×AI×エンタメを融合し、学生が安心してキャリアを選べる新しい学びの体験を提供します。

🇬🇧 English Version

While working in the EdTech field, I had the opportunity to mentor students considering career shifts and those taking gap years. I found a common challenge: many students struggle with anxiety and uncertainty about choosing the right profession that truly fits them. Although information is available from the internet or schools, it’s difficult for them to grasp the real image of workplaces and daily jobs. This gap often becomes a huge barrier in making confident career decisions.
To address this, I envisioned creating a platform where students can experience future workplaces through AI. Veyoo combines Education, AI, and Entertainment, offering students a new way to explore careers and gain confidence in choosing their future paths.

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
