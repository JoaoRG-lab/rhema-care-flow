# GitHub Pages Backup

This deployment is a read-only public backup derived from audited `main`.

## Canonical Hosting

- Production domain: `reumatismos.com` and `www.reumatismos.com` on Vercel.
- Backup URL: `https://joaorg-lab.github.io/rhema-care-flow/`.
- Do not assign `reumatismos.com` to GitHub Pages while Vercel is canonical.

## Workflow

`.github/workflows/main.yml` deploys to GitHub Pages only after a successful
`TMR Deployment Auditor` run for `main`. It builds with the repository path as
the Vite base and adds an SPA `404.html` fallback.

## Activation

1. Review and merge this change through the normal audit gate.
2. In GitHub Pages settings, select GitHub Actions as the deployment source.
3. Remove the existing Pages custom domain claim for `reumatismos.com` only
   after confirming Vercel owns the apex and `www` domain.
4. Validate the backup URL and refresh on application routes.

Changing DNS or public custom-domain ownership remains a separate approved
production action with a rollback record.
