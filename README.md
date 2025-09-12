
# DET File Manager

React frontend for the DET uploader.

**Live:** https://det-uploader.cascadiaquakes.org/

---

## Architecture

Static site (Create React App) built, uploaded to **S3**, and served via **CloudFront**.

- **S3 bucket:** `crescent-react-hosting` (prefix **`det-uploader-app/`**)
- **CloudFront:** Origin Path = `/det-uploader-app` → site is served at the **root** domain

---

## Local development

**Prereqs:** Node.js + npm

```bash
# 1. Create your local configuration from the template
cp .env.example .env

# 2. Fill in the required values in the new .env file

# 3. Install dependencies
npm ci

# 4. Start the local server
npm start
# The application will be running at http://localhost:3000
````

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
This project is configured with an automated CI/CD pipeline using GitHub Actions. The recommended way to deploy changes is to push code to a development branch, which will trigger the automated workflow.

**Workflow:** `.github/workflows/deploy.yml`

**Triggers:** Push to `main` (and `ci/cd-automation`) or manual run from the **Actions** tab.

**What it does:** Writes a `.env` from repo Variables → `npm ci && npm run build` → runs `deploy.sh` → invalidates CloudFront.

*(The workflow securely authenticates to AWS using access keys stored in GitHub Secrets. It then dynamically creates a `.env` file for the build using GitHub Variables, builds the React application, and runs the `deploy.sh` script to upload the files to S3 and invalidate the CloudFront cache.)*

## One-Time Repository Setup (Admin Task)

For the CI/CD pipeline to function, a repository administrator must configure the following secrets and variables.

### Required Configuration

**1. Repository Secrets (Encrypted)**
These are used to securely authenticate the workflow to AWS:
* `AWS_ACCESS_KEY_ID`
* `AWS_SECRET_ACCESS_KEY`

### 2. Repository Variables (Plaintext)

These provide the non-secret configuration needed for the application build and deployment script. **Names must match exactly.** An admin must retrieve the correct, current values from the AWS account.

* `AWS_REGION` = `us-west-2`
* `S3_BUCKET` = `crescent-react-hosting`
* `S3_PREFIX` = `det-uploader-app`
* `CF_DISTRIBUTION_ID` = `<your_cloudfront_distribution_id>`
* `REACT_APP_AWS_REGION` = `us-west-2`
* `REACT_APP_S3_TMP_NAME` = `<your_tmp_bucket_name>`
* `REACT_APP_S3_PROD_NAME` = `<your_prod_bucket_name>`
* `REACT_APP_AWS_USER_POOL_ID` = `<your_user_pool_id>`
* `REACT_APP_AWS_WEB_CLIENT_ID` = `<your_user_pool_client_id>`
* `REACT_APP_AWS_IDENTITY_POOL_ID` = `<your_identity_pool_id>`
* `REACT_APP_COGNITO_DOMAIN` = `<your_cognito_domain>`
* `REACT_APP_API_URL` = `<your_api_gateway_base_url>`

### Step-by-Step Setup Instructions

1. **Navigate to Repository Settings**
   - Go to your GitHub repository
   - Click on **Settings** tab
   - In the left sidebar, click **Secrets and variables**
   - Click **Actions**

2. **Add Repository Secrets**
   - Click **New repository secret**
   - Name: `AWS_ACCESS_KEY_ID` | Value: [Your AWS Access Key ID] | Click **Add secret**
   - Click **New repository secret**
   - Name: `AWS_SECRET_ACCESS_KEY` | Value: [Your AWS Secret Access Key] | Click **Add secret**

3. **Switch to Variables Tab**
   - Click on the **Variables** tab (next to Secrets)

4. **Add Repository Variables**
   - Click **New repository variable**
   - Enter the Name and Value for each variable listed in section 2 above
   - Click **Add variable**
   - Repeat this process for all 12 variables

5. **Verify Setup**
   - You should now see 2 secrets in the **Secrets** tab
   - You should see 12 variables in the **Variables** tab
   - All variable names must match exactly as shown above

*Note: Only repository administrators can configure secrets and variables. These values are used by the GitHub Actions workflow to authenticate with AWS and configure the application build.*

> These are the **current dev values**; update if infrastructure changes.

### Deploy via CI/CD

```bash
git push origin main           # or: git push origin ci/cd-automation
# then watch Actions → "Deploy DET File Manager"
```

---

## Troubleshooting

* **Auth errors:** Ensure all `REACT_APP_*` variables are set (locally or in repo Variables) and rebuild.
* **AccessDenied from site:** CloudFront ↔ S3 OAC/policy mismatch—fix in AWS console.
* **Not seeing changes:** Confirm workflow succeeded and invalidation completed; hard refresh.

---

---

## Future Security Improvements

The current pipeline uses long-lived AWS access keys stored as GitHub Secrets. This is a secure and effective method. A future enhancement would be to migrate to **OpenID Connect (OIDC)**. This would establish a direct, keyless trust relationship between GitHub and AWS, further enhancing security by using short-lived, temporary credentials for each deployment.

**Additional Planned Enhancements:**

* **Automated Testing:** Add basic tests (e.g., `npm test --watchAll=false`) before deployment
* **Environment Management:** Split environments (dev/staging/prod) with separate CloudFront distributions or S3 prefixes and per-environment variables

---
