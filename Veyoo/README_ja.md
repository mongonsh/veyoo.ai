# Veyoo（日本語版）

AIキャリア・シミュレーター。Veo3 / Imagen / ADK / Vertex AI を活用して映像生成や会話体験を提供します。

## リポジトリ構成
- `frontend/` React シングルページアプリ（静的ビルド）。API は `REACT_APP_API_BASE_URL` を使用
- `backend/` FastAPI ベースのマイクロサービス群
  - `gateway-service/` フロントエンドからの入口 API
  - `agent-orchestrator/`, `veo-service/`, `imagen-service/`, `mentor-service/`, `analytics-service/`
- `infra/` インフラ（IaC）
  - `infra/main/` Terraform（GKE と VPC）
  - `infra/apigw/` API Gateway（任意）
- `cloudbuild.yaml` すべての Docker イメージをビルド & プッシュ

## ローカル実行（クイック）
```bash
cd frontend && npm ci && npm start
# 各バックエンドは uvicorn/fastapi で起動（各ディレクトリの main.py を参照）
```

## コンテナイメージ
各サービスに `Dockerfile` があります。例（Artifact Registry へ）:
```bash
export PROJECT_ID=YOUR_PROJECT_ID
export REGION=us-central1
gcloud auth configure-docker ${REGION}-docker.pkg.dev

docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/veyoo-repo/gateway-service:latest backend/gateway-service
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/veyoo-repo/gateway-service:latest
```

## デプロイ方法A：Cloud Run（推奨）
クラスタ運用不要で簡単。まず Gateway を公開し、その URL を用いてフロントをビルドします。

1) 必要なサービス有効化とレポジトリ作成
```bash
export PROJECT_ID=YOUR_PROJECT_ID
export REGION=us-central1
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
gcloud artifacts repositories create veyoo-repo --repository-format=docker --location=$REGION --description="Veyoo images" || true
gcloud auth configure-docker $REGION-docker.pkg.dev
```

2) Gateway をデプロイ
```bash
gcloud builds submit backend/gateway-service \
  --tag $REGION-docker.pkg.dev/$PROJECT_ID/veyoo-repo/gateway-service:latest

gcloud run deploy gateway-service \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/veyoo-repo/gateway-service:latest \
  --region $REGION --allow-unauthenticated --port 8080

export GATEWAY_URL=$(gcloud run services describe gateway-service --region $REGION --format='value(status.url)')
```

3) フロントエンドをデプロイ（静的）
React はビルド時に `REACT_APP_API_BASE_URL` を参照します（末尾スラッシュなし）。
```bash
gcloud builds submit frontend \
  --tag $REGION-docker.pkg.dev/$PROJECT_ID/veyoo-repo/frontend:latest \
  -- \
  --build-arg REACT_APP_API_BASE_URL="$GATEWAY_URL"

gcloud run deploy frontend \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/veyoo-repo/frontend:latest \
  --region $REGION --allow-unauthenticated --port 8080
```

4) その他サービス（任意）
```bash
for SVC in agent-orchestrator veo-service imagen-service mentor-service analytics-service; do
  gcloud builds submit backend/$SVC \
    --tag $REGION-docker.pkg.dev/$PROJECT_ID/veyoo-repo/$SVC:latest
  gcloud run deploy $SVC \
    --image $REGION-docker.pkg.dev/$PROJECT_ID/veyoo-repo/$SVC:latest \
    --region $REGION --allow-unauthenticated --port 8080
done
```

### Cloud Run 注意点
- フロントの Nginx は Cloud Run の `${PORT}`（8080）で待ち受けるよう設定（`frontend/nginx/default.conf.template`）。
- Apple Silicon から直接ビルドすると `exec format error` が出る場合があります。Cloud Build を使うと解消できます。
- 別ドメインからアクセスする場合は Gateway 側で CORS 設定が必要です。

## デプロイ方法B：GKE（Terraform）
```bash
cd infra/main
terraform init
terraform apply -auto-approve -var="gcp_project_id=$PROJECT_ID" -var="gcp_region=$REGION"
gcloud container clusters get-credentials veyoo-gke-cluster --region $REGION --project $PROJECT_ID
# 画像参照の置換後に各 k8s マニフェストを適用
```

## デプロイ方法C：Vercel（フロントのみ）
- Framework Preset: "Other"（Next.js ではありません）
- Build Command: `npm run build`
- Output Directory: `build`
- 環境変数: `REACT_APP_API_BASE_URL=https://<Gateway の URL>`
```bash
cd frontend
vercel env add REACT_APP_API_BASE_URL   # Gateway の URL を貼り付け
vercel --prod
```

## 設定・環境変数
- `REACT_APP_API_BASE_URL`（フロントのビルド時）: Gateway サービスのベースURL
- 各バックエンドの機密情報は Cloud Run の「Variables & Secrets」または K8s `Secret` を利用

## Firebase 認証
- Firebase Console → Authentication → 設定 → 許可ドメインにデプロイ先（Vercel など）のドメインを追加
- Sign-in method で Google などを有効化
- API Key を HTTP リファラ制限している場合は、デプロイドメインを許可

## トラブルシューティング
- Cloud Run: `exec format error` → Cloud Build でビルド
- Cloud Run: ポート 80 で失敗 → Nginx が `${PORT}`(8080) を listen しているか確認
- Vercel: "No Next.js version detected" → Framework を "Other" に設定
- フロントから API へ接続不可 → `REACT_APP_API_BASE_URL` の値と CORS 設定を再確認

## ライセンス
MIT
