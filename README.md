
# DET File Manager

React frontend for the DET uploader.

**Live:** https://det-uploader.cascadiaquakes.org/

---

## Architecture

Static site (React + Vite) built, uploaded to **S3**, and served via **CloudFront**.

- **S3 bucket:** `crescent-react-hosting` (prefix **`det-uploader-app/`**)
- **CloudFront:** Origin Path = `/det-uploader-app` → site is served at the **root** domain

---

## Local development

**Prereqs:** Node.js 20+ and npm.

```bash
# 1. Create your local configuration from the template
cp .env.example .env

# 2. Fill in the required values in the new .env file (see the variable
#    list in "One-Time Repository Setup" below — same names locally)

# 3. Install dependencies
npm ci

# 4. Start the local dev server (Vite, with HMR)
npm start
# The application will be running at http://localhost:3000
```

---
## Deployment

The application can be deployed either manually from a local machine or automatically via the CI/CD pipeline.

## Manual deployment

Requires the AWS CLI v2 to be configured with the necessary permissions.
**macOS/Linux**

```bash
export DISTRIBUTION_ID=E394LPINKP5I9U # Set the CloudFront ID to trigger a cache invalidation.
chmod +x ./deploy.sh     # # Make the script executable (one-time setup on macOS/Linux)
./deploy.sh
```

**Windows PowerShell**

```powershell
$env:DISTRIBUTION_ID = "E394LPINKP5I9U"  Set the CloudFront ID to trigger a cache invalidation.
./deploy.sh
```

The script builds, syncs to `s3://crescent-react-hosting/det-uploader-app/` with proper cache headers, then invalidates `/*` on CloudFront.

**Verify:** open [https://det-uploader.cascadiaquakes.org/](https://det-uploader.cascadiaquakes.org/) (hard refresh if needed).

---

## CI/CD (GitHub Actions)

Two workflows:

**`.github/workflows/ci.yml`** runs on every PR. Does `npm ci`, `npm run build`, `npm audit`, and a `gitleaks` secret scan. Has to pass before the PR can merge.

**`.github/workflows/deploy.yml`** runs on push to `master` (and on manual dispatch). Authenticates to AWS via OIDC, writes a `.env` from repo Variables, runs `deploy.sh`, syncs `dist/` to S3, invalidates CloudFront.

Day-to-day flow: open a PR, let CI go green, merge to master, deploy runs.

## One-Time Repository Setup (Admin Task)

For the CI/CD pipeline to function, a repository administrator must configure the following secrets and variables.

### Required Configuration

**1. AWS authentication (OIDC)**

The workflow assumes `arn:aws:iam::818214664804:role/GitHubActionsDeployRole` via OpenID Connect — no long-lived access keys in the repo. The role's trust policy must include `repo:cascadiaquakes/det-file-manager:ref:refs/heads/<branch>` for any branch you want to deploy from.

### 2. Repository Variables (Plaintext)

These provide the non-secret configuration needed for the application build and deployment script. **Names must match exactly.** An admin must retrieve the correct, current values from the AWS account.

* `AWS_REGION` = `us-west-2`
* `S3_BUCKET` = `crescent-react-hosting`
* `S3_PREFIX` = `det-uploader-app`
* `CF_DISTRIBUTION_ID` = `<your_cloudfront_distribution_id>`
* `VITE_AWS_REGION` = `us-west-2`
* `VITE_S3_PROD_NAME` = `<your_prod_bucket_name>`
* `VITE_AWS_USER_POOL_ID` = `<your_user_pool_id>`
* `VITE_AWS_WEB_CLIENT_ID` = `<your_user_pool_client_id>`
* `VITE_AWS_IDENTITY_POOL_ID` = `<your_identity_pool_id>`
* `VITE_COGNITO_DOMAIN` = `<your_cognito_domain>`
* `VITE_API_URL` = `<your_api_gateway_base_url>`

### Step-by-Step Setup Instructions

1. **Navigate to Repository Settings**
   - Go to your GitHub repository
   - Click on **Settings** tab
   - In the left sidebar, click **Secrets and variables**
   - Click **Actions**

2. **Switch to Variables Tab**
   - Click on the **Variables** tab (next to Secrets)

3. **Add Repository Variables**
   - Click **New repository variable**
   - Enter the Name and Value for each variable listed in section 2 above
   - Click **Add variable**
   - Repeat for all 11 variables

4. **Verify Setup**
   - You should see 11 variables in the **Variables** tab
   - The **Secrets** tab should not contain `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — auth is via OIDC
   - All variable names must match exactly as shown above

*Note: Only repository administrators can configure secrets and variables. These values are used by the GitHub Actions workflow to authenticate with AWS and configure the application build.*

### Deploy via CI/CD

```bash
git push origin master
# then watch Actions → "Deploy DET File Manager"
```

---

## Troubleshooting

* **Auth errors:** Ensure all `VITE_*` variables are set (locally or in repo Variables) and rebuild.
* **AccessDenied from site:** CloudFront ↔ S3 OAC/policy mismatch—fix in AWS console.
* **Not seeing changes:** Confirm workflow succeeded and invalidation completed; hard refresh.

---

## Repo hygiene

A few things to know about how this repo is wired up:

* **Master is protected.** No direct pushes — every change goes through a PR with at least one approving review. Force pushes and branch deletion are blocked.
* **CI runs on every PR** (`.github/workflows/ci.yml`): build smoke test, `npm audit`, and a `gitleaks` secret scan. PR can't merge unless this passes.
* **Deploy runs on push to master** (`.github/workflows/deploy.yml`) and authenticates to AWS via OIDC — no long-lived keys in the repo.
* **npm audit is currently informational.** When the Amplify dep tree ships fewer vulns we can flip `continue-on-error: false` so new vulns actually gate the PR.

## What's still on the list

* **Dev/prod environment separation.** This repo only has a production target right now. A `dev` branch + second CloudFront distribution would let us test risky changes against `https://dev-det-uploader.cascadiaquakes.org/` (or similar) before they hit production. The OIDC trust policy already includes `repo:cascadiaquakes/det-file-manager:ref:refs/heads/dev` so the AWS side is pre-wired.
* **Unit / integration tests.** None yet. A `npm test` step would give the CI workflow more to do than just compile-check.

---
