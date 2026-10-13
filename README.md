# DET File Manager

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.18778325.svg)](https://doi.org/10.5281/zenodo.18778325)
[![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD_3--Clause-blue.svg)](LICENSE)

React frontend for uploading benchmark results to the CRESCENT Dynamic Rupture, Earthquake Cycle, and Tsunami (DET) Code Verification Platform. Uploaded results are compared in the companion [V&V dashboard](https://github.com/cascadiaquakes/v-v_dashboard).

**Live uploader:** https://det-uploader.cascadiaquakes.org

**Results dashboard:** https://det.cascadiaquakes.org

---

## Documentation

The platform is described in Bachelot et al. (2026), [*CRESCENT Earthquake Dynamic Rupture, Earthquake Cycle, and Tsunami Code Verification Platform*](https://doi.org/10.26443/seismica.v5i2.2716), *Seismica*.

---

## Features

- Sign in with a CRESCENT platform account, or request access.
- Choose a benchmark and upload result files for it.
- See a processing summary after each upload, listing successful, failed and missing files.
- Manage previous uploads, including deleting folders.

---

## Architecture

Static site (React + Vite) built, uploaded to **S3**, and served via **CloudFront**.

- **S3 bucket:** `crescent-react-hosting`
  - prod files at prefix `det-uploader-app/`
  - dev files at prefix `det-uploader-app/dev/`
- **CloudFront:** distribution `E394LPINKP5I9U`, Origin Path = `/det-uploader-app`. The same distribution serves both prod (`/`) and dev (`/dev/`).
- **CloudFront Function:** `det-uploader-spa-rewriter` is attached to the default behavior on viewer-request and rewrites any URL ending in `/` (or any extensionless path) to append `/index.html`. Without it, hitting `https://.../dev/` returns S3 AccessDenied because S3 has no concept of a directory index.

---

## Running Locally

**Prerequisites:** Node.js 20+ and npm.

```bash
# 1. Create your local configuration from the template
cp .env.example .env

# 2. Fill in the required values in .env (the variable names are listed in docs/MAINTAINERS.md)

# 3. Install dependencies
npm ci

# 4. Start the local dev server (Vite, with HMR)
npm start
# The application will be running at http://localhost:3000
```

---

## Project Structure

```
det-file-manager/
├── src/
│   ├── components/       # File upload, benchmark links, upload management, header
│   ├── App.js            # App shell and sign-in flow
│   └── awsConfig.js      # Amplify / Cognito configuration
├── public/               # Static assets (logos, manifest)
├── docs/MAINTAINERS.md   # Admin setup, manual deploys, repo conventions
├── .github/workflows/    # CI and deploy workflows
├── deploy.sh             # Manual deploy script
├── .env.example          # Template for local configuration
└── vite.config.js
```

---

## Deployment

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | Every PR | `npm ci`, Vitest, build, `npm audit` and a `gitleaks` secret scan; must pass before merging |
| `deploy-dev.yml` | Push to `dev` | Deploys to https://det-uploader.cascadiaquakes.org/dev/ and invalidates only `/dev/*` |
| `deploy.yml` | Push to `master` | Deploys to production and invalidates the whole distribution |

Day-to-day flow: open a PR to `dev`, let CI go green, merge, preview at the dev URL. When happy, open a PR `dev → master`, merge, and the production deploy runs.

Manual deploys, the one-time repository setup (OIDC role and repository variables) and repo conventions are in [docs/MAINTAINERS.md](docs/MAINTAINERS.md).

---

## Troubleshooting

- **Auth errors on the frontend:** ensure all `VITE_*` variables are set (locally in `.env`, or in repo Variables) and rebuild.
- **AccessDenied on a path like `/dev/`:** the CloudFront Function `det-uploader-spa-rewriter` is either not associated with the distribution or got removed. Reattach it to the default behavior on the viewer-request event.
- **Not seeing changes:** confirm the workflow succeeded and the invalidation completed, then hard refresh the browser.

---

## How to Cite

> Bachelot, L., & Marfo, W. (2026). *DET File Manager* (v1.0.1). Zenodo. https://doi.org/10.5281/zenodo.18778325

The platform is described in:

> Bachelot, L., Kutschera, F., Barall, M., Erickson, B. A., Dunham, E. M., Gabriel, A.-A., Harris, R., Ma, S., Thomas, A. M., & Zhang, W. (2026). CRESCENT Earthquake Dynamic Rupture, Earthquake Cycle, and Tsunami Code Verification Platform. *Seismica*, 5(2). https://doi.org/10.26443/seismica.v5i2.2716

---

## License

This project is licensed under the BSD 3-Clause License. See [LICENSE](LICENSE).

---

## Contacts

- **Loïc Bachelot**, University of Oregon: [lbachelo@uoregon.edu](mailto:lbachelo@uoregon.edu)
- **William Marfo**, University of California, Davis: [wmarfo@ucdavis.edu](mailto:wmarfo@ucdavis.edu)
- **Amanda M. Thomas**, University of California, Davis: [amthom@ucdavis.edu](mailto:amthom@ucdavis.edu)

For bugs or feature requests, please [open an issue](https://github.com/cascadiaquakes/det-file-manager/issues).

---

## Acknowledgments

<table>
  <tr>
    <td align="center" valign="middle">
      <img src="https://raw.githubusercontent.com/cascadiaquakes/.github/main/assets/crescent-circle.png" alt="CRESCENT Logo" width="150" />
    </td>
    <td align="center" valign="middle">
      <img src="https://raw.githubusercontent.com/cascadiaquakes/.github/main/assets/nsf-logo.png" alt="NSF Logo" width="450" />
    </td>
  </tr>
</table>

This project is supported by the National Science Foundation through the Cascadia Region Earthquake Science Center (CRESCENT), Cooperative Agreement EAR-2225286.
