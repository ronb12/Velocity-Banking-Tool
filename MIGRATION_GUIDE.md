# File Migration Guide
## Updating Paths After Migration

After moving files to the new structure, you need to update all references.

## File Locations

### HTML Files
- **Auth Pages:** `src/pages/auth/` (login.html, register.html, reset.html)
- **Debt Pages:** `src/pages/debt/` (Debt_Tracker.html, debt-crusher.html)
- **Savings Pages:** `src/pages/savings/` (savings_goal_tracker.html, challenge_library.html)
- **Calculators:** `src/pages/calculators/` (Velocity_Calculator.html, 1099_calculator.html, Credit_Score_Estimator.html)
- **Other Pages:** `src/pages/other/` (budget.html, income.html, calendar.html, etc.)
- **Dashboard:** `index.html` (stays in root for now)

### CSS Files
- **Theme:** `src/styles/theme.css`
- **Auth:** `src/styles/auth/login.css`, `src/styles/auth/login-styles.css`
- **Dashboard:** `src/styles/index-inline.css`, `src/styles/dashboard.css`

### JavaScript Files
- **Core:** `src/scripts/core/` (auth.js, sync.js, config.js, StateManager.js)
- **Components:** `src/scripts/components/` (ProfileModal.js, ThemeSelector.js)
- **Pages:** `src/scripts/pages/` (Dashboard.js, index-inline.js)
- **Utils:** `utils/` (stays in root)

### Test Files
- **Unit Tests:** `tests/unit/`
- **Integration Tests:** `tests/integration/`
- **E2E Tests:** `tests/e2e/`

## Path Updates Needed

### In HTML Files:
- Update CSS links: `href="theme.css"` → `href="../styles/theme.css"` or `href="../../styles/theme.css"`
- Update JS imports: `src="auth.js"` → `src="../scripts/core/auth.js"`
- Update image paths: `src="icons/icon-192.png"` → `src="../../icons/icon-192.png"`

### In JavaScript Files:
- Update imports: `import { auth } from './auth.js'` → `import { auth } from '../core/auth.js'`
- Update utility imports: `import { ... } from './utils/...'` → `import { ... } from '../../utils/...'`

### In CSS Files:
- Update image paths: `url(icons/...)` → `url(../../icons/...)`

## Firebase Hosting Configuration

Update `firebase.json` to serve files from new locations or configure rewrites.

## Next Steps

1. Update all import paths
2. Test each page
3. Update Firebase hosting config
4. Test deployment

---

*This guide will be updated as migration progresses.*

