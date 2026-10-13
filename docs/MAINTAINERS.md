# Maintainer Notes

Operational details for people who deploy and administer the DET File Manager. For an overview, see the [README](../README.md).

## Manual deployment

Requires the AWS CLI v2 to be configured with the necessary permissions.

**macOS/Linux**

```bash
export DISTRIBUTION_ID=E394LPINKP5I9U   # CloudFront ID, for cache invalidation
chmod +x ./deploy.sh                    # one-time on macOS/Linux
./deploy.sh
```

**Windows PowerShell**

```powershell
$env:DISTRIBUTION_ID = "E394LPINKP5I9U"  # CloudFront ID, for cache invalidation
./deploy.sh
```

The script builds, syncs to `s3://crescent-react-hosting/det-uploader-app/` with proper cache headers, then invalidates `/*` on CloudFront.

**Verify:** open https://det-uploader.cascadiaquakes.org/ (hard refresh if needed).

## CI notes

`npm audit` in `ci.yml` is currently informational; flip `continue-on-error: false` when the Amplify dependency tree ships fewer vulnerabilities and new ones should gate the PR.

## One-time repository setup (admin task)

For the CI/CD pipeline to function, a repository administrator must configure the following.

### 1. AWS authentication (OIDC)

The workflows assume `arn:aws:iam::818214664804:role/GitHubActionsDeployRole` via OpenID Connect. No long-lived access keys live in the repo. The role's trust policy must include `repo:cascadiaquakes/det-file-manager:ref:refs/heads/master` and `:dev` for deploys to work.

### 2. Repository variables

These provide the non-secret configuration the build and deployment scripts read. **Names must match exactly.** An admin must retrieve the current values from the AWS account. The same names are used locally in `.env`.

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

### Step-by-step setup

1. Repo → **Settings** → **Secrets and variables** → **Actions**
2. **Variables** tab → **New repository variable**
3. Add each variable from section 2 above (11 total)
4. The **Secrets** tab should NOT contain `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY`. Auth is OIDC; if those are still there from before the OIDC migration, delete them.

Only repository administrators can configure variables.

## Repo conventions

* **Master is protected.** No direct pushes. Every change goes through a PR with at least one approving review. Force pushes and branch deletion are blocked. The CI check (`build-and-scan`) is required.
* **Same applies in practice for `dev`.** It's not branch-protected at GitHub level (so you can push directly if you need to), but the team convention is to PR into dev too.
* **Deploy roles are scoped per branch.** The IAM trust policy only allows OIDC token assumption from `refs/heads/master` and `refs/heads/dev`. PRs from forks or feature branches can't reach AWS.

## Still on the list

* **More test coverage.** We have a Vitest smoke suite (`npm test`) that proves the app compiles and the Amplify sign-in screen renders. Component-level and authenticated-flow tests would need Amplify auth mocking, which we haven't taken on yet.
* **Fully isolated dev backend.** The dev environment currently shares the prod Cognito pool, S3 bucket and API. That's fine for previewing UI changes, but a dev user can still write real files to prod storage. A proper split would need a dev Cognito pool, a dev S3 bucket and a dev API stack, which is a backend coordination ask.
