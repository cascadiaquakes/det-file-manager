#!/usr/bin/env bash
# Deploy the DET File Manager (CRA) to S3 (+ optional CloudFront invalidate)

set -euo pipefail

# --- Config: update if these ever change ---
BUCKET="crescent-react-hosting"      # S3 bucket name
PREFIX="det-uploader-app"            # subfolder in the bucket (no leading/trailing slash)
REGION="us-west-2"                   # bucket's region
DISTRIBUTION_ID="${DISTRIBUTION_ID:-}"  # optional; set env var to invalidate CF

# --- Preflight ---
command -v aws >/dev/null  || { echo "ERROR: aws CLI v2 required"; exit 1; }
command -v npm >/dev/null  || { echo "ERROR: npm required"; exit 1; }

echo "Deploying build/ to s3://${BUCKET}/${PREFIX}/ (region ${REGION})"
echo "CloudFront root (/) should map to s3://${BUCKET}/${PREFIX}/ via Origin path."

# Load CRA env vars for local/manual runs (CI writes .env before calling this)
if [[ -f .env ]]; then
  echo "Loading .env (CRA build-time variables)…"
  set -o allexport
  # shellcheck disable=SC1091
  source .env
  set +o allexport
fi

# 1) Install deps and build (CRA uses package.json: homepage="/")
npm ci
npm run build

# 2) Push static assets (hashed filenames) with long cache
aws s3 sync build/ "s3://${BUCKET}/${PREFIX}/" \
  --region "${REGION}" \
  --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable" \
  --delete

# 3) Push index.html with no cache so users always get the latest shell
aws s3 cp build/index.html "s3://${BUCKET}/${PREFIX}/index.html" \
  --region "${REGION}" \
  --content-type "text/html" \
  --cache-control "no-cache,must-revalidate,public,max-age=0" \
  --metadata-directive REPLACE

# 4) (Optional) Invalidate CloudFront. Because Origin path = /det-uploader-app,
#    viewer paths live at ROOT, so invalidate "/*".
if [[ -n "${DISTRIBUTION_ID}" ]]; then
  echo "Invalidating CloudFront distribution ${DISTRIBUTION_ID}..."
  aws cloudfront create-invalidation \
    --distribution-id "${DISTRIBUTION_ID}" \
    --paths "/*"
fi

echo "✅ Deployment successful."