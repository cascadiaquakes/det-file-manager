```bash
#!/usr/bin/env bash
# Deploy the DET File Manager (CRA) to S3 (+ optional CloudFront)

set -euo pipefail

# --- Load local env (for CRA REACT_APP_* etc.) ---
if [ -f .env ]; then
  echo "Loading .env ..."
  set -a
  . ./.env
  set +a
fi

# --- Config (env overrides allowed) ---
AWS_REGION="${AWS_REGION:-${REACT_APP_AWS_REGION:-us-west-2}}"
S3_BUCKET="${S3_BUCKET:-crescent-react-hosting}"
S3_PREFIX="${S3_PREFIX:-det-uploader-app}"
DISTRIBUTION_ID="${DISTRIBUTION_ID:-}"

# --- Preflight ---
command -v aws >/dev/null  || { echo "ERROR: aws CLI v2 required"; exit 1; }
command -v npm >/dev/null  || { echo "ERROR: npm required"; exit 1; }

echo "Deploying build/ to s3://${S3_BUCKET}/${S3_PREFIX}/ (region ${AWS_REGION})"
echo "CloudFront root (/) should map to s3://${S3_BUCKET}/${S3_PREFIX}/ via Origin Path."

# 1) Install deps & build
npm ci
npm run build

# 2) Sync hashed assets (exclude index.html) with long cache
aws s3 sync build/ "s3://${S3_BUCKET}/${S3_PREFIX}/" \
  --region "${AWS_REGION}" \
  --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable" \
  --delete

# 3) Upload index.html with no-cache so users get latest shell
aws s3 cp build/index.html "s3://${S3_BUCKET}/${S3_PREFIX}/index.html" \
  --region "${AWS_REGION}" \
  --content-type "text/html" \
  --cache-control "no-cache,must-revalidate,public,max-age=0" \
  --metadata-directive REPLACE

# 4) (Optional) Invalidate CloudFront (viewer paths live at '/')
if [ -n "${DISTRIBUTION_ID}" ]; then
  echo "Invalidating CloudFront distribution ${DISTRIBUTION_ID} ..."
  aws cloudfront create-invalidation \
    --distribution-id "${DISTRIBUTION_ID}" \
    --paths "/*"
fi

echo "✅ Deployment successful."
```