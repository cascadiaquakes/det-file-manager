# DET File Manager

React frontend for the DET file manager.

## Architecture

Static site (Create React App) built locally, uploaded to **S3** and served via **CloudFront**.

* **S3 bucket:** `crescent-react-hosting` (prefix: `det-uploader-app/`)
* **CloudFront (dev):** [https://det-uploader.cascadiaquakes.org/](https://det-uploader.cascadiaquakes.org/)

## Local development

**Prereqs:** Node.js + npm

```bash
npm ci
npm start
# http://localhost:3000
```

## Manual deploy (dev)

Prereqs: AWS CLI v2 logged into the earthscope-crescent account with access to the bucket and CloudFront.

1. Put runtime settings in a local **`.env`** (not committed). Example keys are in **`.env.example`**.
2. Build & deploy via the script (invalidates CloudFront so changes show immediately):

**macOS/Linux**

```bash
export DISTRIBUTION_ID=E394LPINKP5I9U
chmod +x ./deploy.sh   # one-time
./deploy.sh
```

**Windows PowerShell**

```powershell
$env:DISTRIBUTION_ID = "E394LPINKP5I9U"
./deploy.sh
```

That script:

* builds the app (`npm run build`)
* syncs to `s3://crescent-react-hosting/det-uploader-app/` with proper cache headers
* invalidates `/*` on the CloudFront distribution

**Verify:** open [https://det-uploader.cascadiaquakes.org/](https://det-uploader.cascadiaquakes.org/) (hard refresh if needed).

## Troubleshooting

* **AccessDenied at the site:** CloudFront ↔ S3 permissions (OAC) may be misconfigured—needs fix in AWS console.
* **Auth errors:** ensure `.env` has the Cognito/UserPool/API values used by `awsConfig.js`; rebuild and redeploy.

## Cost

Main cost is S3 storage + CloudFront bandwidth. To pause serving, disable the CloudFront distribution.
