#!/bin/bash

# Script to set environment variables on the Cloud Run service
# Run this after every firebase deploy --only hosting

echo "Setting environment variables on Cloud Run service..."

# Read the private key from .env file
PRIVATE_KEY=$(grep "ADMIN_PRIVATE_KEY" .env | cut -d'"' -f2 | sed 's/\\n/\n/g')

# Update the Cloud Run service with all environment variables
gcloud run services update ssrformgenai4545 \
  --region=us-central1 \
  --update-env-vars="ADMIN_PROJECT_ID=formgenai-4545,ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@formgenai-4545.iam.gserviceaccount.com,ADMIN_STORAGE_BUCKET=formgenai-4545.firebasestorage.app,ADMIN_PRIVATE_KEY=${PRIVATE_KEY}"

echo "✅ Environment variables set successfully!"
echo "⏳ Waiting 10 seconds for new revision to be ready..."
sleep 10
echo "✅ Ready to test!"
