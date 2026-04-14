# Publishing Checklist

Use this checklist when shipping a new `viscera` release.

## Before You Publish

- Confirm the version in `package.json` and `package-lock.json`
- Review `CHANGELOG.md`
- Run `npm test`
- Run `npm run pack:preview`
- Check the tarball contents for unexpected files
- Confirm `README.md` and `docs/index.html` match the current API
- Confirm fixture images still pass offline OCR tests

## Git Release Flow

```bash
git status
git add README.md CHANGELOG.md docs index.js package.json package-lock.json presets scripts test
git commit -m "release: v0.2.0"
git tag -a v0.2.0 -m "v0.2.0"
git push origin main
git push origin v0.2.0
```

## GitHub Pages

- In GitHub repository settings, open `Pages`
- Set the source to `Deploy from a branch`
- Choose branch `main`
- Choose folder `/docs`
- Save and wait for the site to publish

## npm Publish

```bash
npm publish
```

## After Publish

- Create or confirm the GitHub release for the tag
- Visit the GitHub Pages site
- Install from npm in a clean sample project to sanity-check the package
