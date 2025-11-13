# GitHub Actions Workflows

## CI/CD Pipeline

The CI/CD pipeline runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

### Jobs

1. **Build** - Builds the project on Node.js 18.x and 20.x
   - Installs dependencies
   - Runs linter (non-blocking)
   - Builds project with `DISABLE_PWA=true`
   - Uploads build artifacts

2. **Test** - Runs tests and verification
   - Installs dependencies
   - Runs tests (non-blocking)
   - Runs path verification (non-blocking)

3. **Deploy** - Deploys to Firebase (only on main branch)
   - Only runs if Firebase secrets are configured
   - Deploys to Firebase Hosting

### Environment Variables

The workflow uses:
- `DISABLE_PWA=true` - Disables PWA plugin during build (fixes path issues)
- `NODE_ENV=production` - Sets production environment

### Secrets Required (for deployment)

- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON
- `FIREBASE_PROJECT_ID` - Firebase project ID

If these secrets are not configured, the deploy step will be skipped (non-blocking).

### Build Configuration

The build uses:
```bash
DISABLE_PWA=true npm run build
```

This prevents PWA service worker generation issues with paths containing spaces.

