# Yidan Xia Personal Website

This folder is ready to use as the root of the `elena-xia.github.io` GitHub Pages repository.

## Structure

- `index.html`: personal homepage.
- `projects/pcs-nightlight/index.html`: completed project page for the Double Reduction / nighttime light project.
- `projects/spatial-methods/index.html`: placeholder project page.
- `projects/policy-notes/index.html`: placeholder project page.
- `assets/styles.css`: shared site styling.
- `assets/pcs/`: selected figures and the final paper PDF.

## How Project Links Work

GitHub Pages serves static files. A link to:

```text
projects/pcs-nightlight/
```

opens:

```text
projects/pcs-nightlight/index.html
```

So each future project can be added as:

```text
projects/new-project-name/index.html
```

Then add a card or navigation link to it from the homepage.

## Deployment

Copy the contents of this `site/` folder into the root of `elena-xia.github.io`, commit, and push. The custom domain `YIDANXIA.COM` should keep working as long as the GitHub Pages repository settings and Cloudflare DNS already point to the site.
