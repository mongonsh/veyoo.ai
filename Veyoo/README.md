# Veyoo

AI‑powered career simulator using Veo3, Imagen, ADK, and Vertex AI.

## Monorepo layout
- `frontend/` React SPA (static build). Uses `REACT_APP_API_BASE_URL` to call the gateway.
- `backend/` Python microservices (FastAPI):
  - `gateway-service/` entry API the frontend talks to
  - `agent-orchestrator/`, `veo-service/`, `imagen-service/`, `mentor-service/`, `analytics-service/`
- `infra/` IaC
  - `infra/main/` Terraform (GKE + VPC)
  - `infra/apigw/` API Gateway (optional)
- `cloudbuild.yaml` CI to build and push all images

## Quick start (local)
```bash
cd frontend && npm ci && npm start
# backend services use standard uvicorn/fastapi entrypoints; see each service's README or main.py
```

## Container images
Each service has a `Dockerfile`. Example local build/push to Artifact Registry:
```bash
export PROJECT_ID=YOUR_PROJECT_ID
export REGION=us-central1
gcloud auth configure-docker ${REGION}-docker.pkg.dev

docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/veyoo-repo/gateway-service:latest backend/gateway-service
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/veyoo-repo/gateway-service:latest
```

## Deploy option A: Cloud Run (recommended)
Zero cluster management, great for hackathons. Deploy gateway first, then frontend and other services.

1) Enable services and create a Docker repo
```bash
export PROJECT_ID=YOUR_PROJECT_ID
export REGION=us-central1
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
gcloud artifacts repositories create veyoo-repo --repository-format=docker --location=$REGION --description="Veyoo images" || true
gcloud auth configure-docker $REGION-docker.pkg.dev
```

2) Deploy gateway
```bash
gcloud builds submit backend/gateway-service \
  --tag $REGION-docker.pkg.dev/$PROJECT_ID/veyoo-repo/gateway-service:latest
gcloud run deploy gateway-service \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/veyoo-repo/gateway-service:latest \
  --region $REGION --allow-unauthenticated --port 8080

export GATEWAY_URL=$(gcloud run services describe gateway-service --region $REGION --format='value(status.url)')
```

3) Deploy frontend (static)
- The React app reads `process.env.REACT_APP_API_BASE_URL` at build time.
- Set it to the gateway URL (no trailing slash).
```bash
gcloud builds submit frontend \
  --tag $REGION-docker.pkg.dev/$PROJECT_ID/veyoo-repo/frontend:latest \
  -- \
  --build-arg REACT_APP_API_BASE_URL="$GATEWAY_URL"

gcloud run deploy frontend \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/veyoo-repo/frontend:latest \
  --region $REGION --allow-unauthenticated --port 8080
```

4) Deploy the remaining services (optional)
```bash
for SVC in agent-orchestrator veo-service imagen-service mentor-service analytics-service; do
  gcloud builds submit backend/$SVC \
    --tag $REGION-docker.pkg.dev/$PROJECT_ID/veyoo-repo/$SVC:latest
  gcloud run deploy $SVC \
    --image $REGION-docker.pkg.dev/$PROJECT_ID/veyoo-repo/$SVC:latest \
    --region $REGION --allow-unauthenticated --port 8080
done
```

### Cloud Run notes
- Frontend `Dockerfile` runs Nginx and is set to listen on `${PORT}` (8080 on Cloud Run) via `/etc/nginx/templates/default.conf.template`.
- If you build on Apple Silicon, prefer Cloud Build to avoid `exec format error`.
- Add CORS on gateway if the frontend originates from another domain.

## Deploy option B: GKE (Terraform)
Provision cluster and network, then apply k8s manifests.
```bash
cd infra/main
terraform init
terraform apply -auto-approve -var="gcp_project_id=$PROJECT_ID" -var="gcp_region=$REGION"
gcloud container clusters get-credentials veyoo-gke-cluster --region $REGION --project $PROJECT_ID

# Update images in all `k8s/deployment.yaml` to use your project/repo, then:
kubectl apply -f ../..  # or apply per-service directories
```

## Deploy option C: Vercel (frontend only)
If you want to host only the React app on Vercel:
- Framework preset: “Other” (this is not Next.js)
- Build command: `npm run build`
- Output directory: `build`
- Env var: `REACT_APP_API_BASE_URL=https://<your-gateway-url>`
```bash
cd frontend
vercel env add REACT_APP_API_BASE_URL   # paste gateway URL
vercel --prod
```

## Configuration
- `REACT_APP_API_BASE_URL` (frontend build‑time): base URL of `gateway-service`, e.g. `https://gateway-service-xxxx-uc.a.run.app`
- Per‑service env vars: set via Cloud Run “Variables & Secrets” or Kubernetes `ConfigMap`/`Secret` as needed.

## Troubleshooting
- Cloud Run deploy failed: “exec format error” → build on Cloud Build (linux/amd64).
- Cloud Run health check failed on port 80 → ensure Nginx listens on `${PORT}` (Dockerfile + `nginx/default.conf.template`).
- Vercel error “No Next.js version detected” → choose framework preset “Other”, not Next.js.
- Frontend can’t reach backend → confirm `REACT_APP_API_BASE_URL` has no trailing slash and is reachable.

## License
MIT