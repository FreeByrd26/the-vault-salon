# The Vault by Nicole Strachan — Static Site

Original site for The Vault by Nicole Strachan, informed by [thevaultnewcanaan.com](https://www.thevaultnewcanaan.com) (Simvoly) combined with the live
[GlossGenius booking site](https://thevaultnc.glossgenius.com), built for GitHub Pages.

All booking CTAs point to GlossGenius: **https://thevaultnc.glossgenius.com**

## Pages

| File | Content | Source |
|---|---|---|
| `index.html` | One-page site: split hero, experience steps, full 49-service price menu, IBE spotlight, artists, hours & contact | Original design; copy/pricing from Simvoly + GlossGenius |
| `policies.html` | Appointment cancellation & no-show policy | GlossGenius About page |

No build step — plain HTML/CSS (`css/style.css`), self-hosted images in `assets/`.

## Deploy to GitHub Pages

```sh
gh repo create the-vault-salon --public --source . --push
gh api repos/{owner}/the-vault-salon/pages -X POST -f 'source[branch]=main' -f 'source[path]=/'
```

Or manually: create a repo on github.com, push `main`, then
**Settings → Pages → Deploy from branch → main / (root)**.

The site is fully static — any static host (Vercel, Netlify, S3) works the same way.

## Local preview

```sh
python3 -m http.server 8741
# → http://localhost:8741
```

## Updating services/pricing

Pricing was extracted from the GlossGenius site's structured data. To refresh it,
re-scrape `https://thevaultnc.glossgenius.com/services` (`__NEXT_DATA__` JSON) and
regenerate the services page.
