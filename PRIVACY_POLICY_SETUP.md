# Privacy Policy Setup for Chrome Web Store

## Issue

Chrome Web Store requires a publicly accessible privacy policy link for the extension.

**Product Name:** SVG Extractor Pro
**Product ID:** eiklnkohojncjhipjlnijgiofiapdpoo
**Violation:** Purple Nickel - Privacy policy link is unavailable or not working

## Solution

We've set up a GitHub Pages site with the privacy policy.

### Privacy Policy URL

Once GitHub Pages is enabled, the privacy policy will be available at:

```
https://ruslanlap.github.io/SVG-Extractor-Firefox-and-Chrome-add-on/
```

### Steps to Enable GitHub Pages

1. Go to repository Settings: https://github.com/ruslanlap/SVG-Extractor-Firefox-and-Chrome-add-on/settings/pages

2. Under "Build and deployment":
   - **Source:** Deploy from a branch
   - **Branch:** Select `gh-pages` / `(root)`
   - Click **Save**

3. Wait 2-3 minutes for GitHub Pages to deploy

4. Verify the privacy policy is accessible at: https://ruslanlap.github.io/SVG-Extractor-Firefox-and-Chrome-add-on/

### Alternative: Use docs/ folder

Alternatively, you can use the `docs/` folder from the main branch:

1. Go to repository Settings → Pages
2. Under "Build and deployment":
   - **Source:** Deploy from a branch
   - **Branch:** Select `main` or your default branch / `/docs`
   - Click **Save**

### Update Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)

2. Select **SVG Extractor Pro** (eiklnkohojncjhipjlnijgiofiapdpoo)

3. Navigate to **Privacy** tab

4. Add the Privacy Policy URL:
   ```
   https://ruslanlap.github.io/SVG-Extractor-Firefox-and-Chrome-add-on/
   ```

5. Click **Save Draft** and then **Submit for Review**

## Files Created

- `docs/index.html` - HTML version of privacy policy
- `docs/_config.yml` - Jekyll configuration for GitHub Pages
- `PRIVACY_POLICY.md` - Markdown version (already exists)

## Verification

After setup, verify:
- [ ] GitHub Pages site is live
- [ ] Privacy policy is accessible and displays correctly
- [ ] Chrome Web Store listing shows the privacy policy link
- [ ] Link is added to Chrome Web Store developer dashboard

## Notes

- The privacy policy is in English as required by Chrome Web Store
- All content is identical to PRIVACY_POLICY.md
- The HTML version has better formatting and styling
- No changes to the extension code are needed
