#!/usr/bin/env bash
# Deploy the DET File Manager (CRA) to S3 (+ optional CloudFront invalidate)

set -euo pipefail

# --- Load .env so CRA gets the REACT_APP_* values for build ---
if [[ -f ".env" ]]; then
  set -a
  . ./.env
  set +a
fi

# --- Config (matches current AWS setup) ---
BUCKET="crescent-react-hosting"          # S3 bucket name
PREFIX="det-uploader-app"                # subfolder in the bucket (no leading/trailing slash)
REGION="${REACT_APP_AWS_REGION:-us-west-2}"  # use .env region, default us-west-2
DISTRIBUTION_ID="${DISTRIBUTION_ID:-}"   # optional; export before running to invalidate CF

# --- Preflight ---
command -v aws >/dev/null  || { echo "ERROR: aws CLI v2 required"; exit 1; }
command -v npm >/dev/null  || { echo "ERROR: npm required"; exit 1; }

echo "Deploying build/ to s3://${BUCKET}/${PREFIX}/ (region ${REGION})"
echo "CloudFront root (/) should map to s3://${BUCKET}/${PREFIX}/ via Origin path."

# 1) Install deps & build (CRA reads env from .env automatically)
npm ci
npm run build

# 2) Sync hashed assets (long cache)
aws s3 sync build/ "s3://${BUCKET}/${PREFIX}/" \
  --region "${REGION}" \
  --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable" \
  --delete

# 3) Upload index.html (no cache)
aws s3 cp build/index.html "s3://${BUCKET}/${PREFIX}/index.html" \
  --region "${REGION}" \
  --content-type "text/html" \
  --cache-control "no-cache,must-revalidate,public,max-age=0" \
  --metadata-directive REPLACE

# 4) (Optional) Invalidate CloudFront at the root (/*) since OriginPath=/det-uploader-app
if [[ -n "${DISTRIBUTION_ID}" ]]; then
  echo "Invalidating CloudFront distribution ${DISTRIBUTION_ID}..."
  aws cloudfront create-invalidation \
    --distribution-id "${DISTRIBUTION_ID}" \
    --paths "/*"
fi

echo "✅ Deployment successful."
