#!/bin/bash

# Exit on error
set -e

# --- Configuration ---
if [ -f .env ]; then
  export $(cat .env | sed 's/#.*//g' | xargs)
fi

if [ -z "$GCP_PROJECT_ID" ]; then
  echo "Please set the GCP_PROJECT_ID environment variable in a .env file or as an environment variable."
  exit 1
fi

# --- Infrastructure Deployment (Main) ---
echo "Deploying main infrastructure..."
cd Veyoo/infra/main
terraform init
terraform apply -auto-approve -var="gcp_project_id=$GCP_PROJECT_ID"
cd ../../..

# --- Application Deployment (Cloud Build) ---
echo "Deploying application with Cloud Build..."
gcloud builds submit Veyoo --config Veyoo/cloudbuild.yaml --substitutions=COMMIT_SHA=$(git rev-parse --short HEAD)

# --- Infrastructure Deployment (API Gateway) ---
echo "Deploying API Gateway..."
cd Veyoo/infra/apigw
terraform init
terraform apply -auto-approve -var="gcp_project_id=$GCP_PROJECT_ID"
cd ../../..

echo "Deployment submitted successfully!"
echo "It may take a few minutes for the deployment to complete."
echo "You can monitor the progress in the Google Cloud Console."