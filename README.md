# Fred Wong Innovation Studio

A responsive, dependency-free single-page studio website. Plain HTML and CSS, with locally drawn decorative artwork, system fonts, and no build step or JavaScript required.

## Preview

From the repository root:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. You can also open `index.html` directly.

## GitHub Pages

After committing and pushing these files to GitHub, open **Settings → Pages → Build and deployment**. Select **Deploy from a branch**, choose the branch containing the website, select **/ (root)**, and save. No workflow or build configuration is required. Relative asset paths support both repository project URLs and custom domains.

Deployment has not been performed. A custom domain is optional and would need separate DNS and Pages configuration.

## Editing

- `index.html`: copy, section structure, experiment cards and email link.
- `styles.css`: responsive layout, typography, abstract artwork and reduced-motion handling.
- `favicon.svg`: studio icon.
- `.nojekyll`: serves the site as plain static files.

Experiment artwork is conceptual, not a product screenshot. Cards are semantic articles with stable IDs; when real case studies exist, add links to their headings. No placeholder case-study links or invented outcomes are included.
