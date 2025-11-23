# How to Share Xcode Scheme for Xcode Cloud

## ⚠️ Important: Scheme Must Be Shared

Xcode Cloud requires schemes to be **shared** (in `xcshareddata/xcschemes/`) to work properly.

## Method 1: Using Xcode (Recommended)

1. **Open the project in Xcode:**
   ```bash
   open BradleysFinanceHub.xcodeproj
   ```

2. **Share the scheme:**
   - Go to **Product** → **Scheme** → **Manage Schemes...**
   - Find **BradleysFinanceHub** in the list
   - **Check the "Shared" checkbox** next to it
   - Click **Close**

3. **Verify:**
   - The scheme file should now appear in:
     `BradleysFinanceHub.xcodeproj/xcshareddata/xcschemes/BradleysFinanceHub.xcscheme`

4. **Commit the shared scheme:**
   ```bash
   git add BradleysFinanceHub.xcodeproj/xcshareddata/xcschemes/
   git commit -m "Share scheme for Xcode Cloud"
   git push origin main
   ```

## Method 2: Using Command Line

If you prefer command line, you can use this script:

```bash
# Open Xcode and share the scheme manually, then:
git add BradleysFinanceHub.xcodeproj/xcshareddata/xcschemes/
git commit -m "Share scheme for Xcode Cloud"
git push origin main
```

## Verification

After sharing the scheme, verify it exists:

```bash
ls -la BradleysFinanceHub.xcodeproj/xcshareddata/xcschemes/
```

You should see: `BradleysFinanceHub.xcscheme`

## Why This Is Required

- Xcode Cloud runs in a clean environment
- It cannot access user-specific scheme files (`xcuserdata/`)
- Only shared schemes (`xcshareddata/xcschemes/`) are available to Xcode Cloud
- The scheme must be committed to git for Xcode Cloud to use it

## Current Status

✅ `ci_scripts/` directory created  
✅ `.xcode-version` file created  
❌ **Scheme not yet shared** (needs to be done in Xcode)

---

**Next Step:** Open Xcode and share the scheme using Method 1 above.

