# Publishing to npmjs.org

How to release the shadcn-aurelia packages. Releases are managed with
[Changesets](https://github.com/changesets/changesets) (already configured in
`.changeset/config.json` with `"access": "public"`).

## What gets published

| Package | npm name | Contents |
|---|---|---|
| `packages/cli` | `shadcn-aurelia` | the CLI (`dist/`, bin `shadcn-aurelia`) |
| `packages/primitives` | `@shadcn-aurelia/primitives` | behavior facade layer (`dist/`) |
| `packages/tw-preset` | `@shadcn-aurelia/tw-preset` | Tailwind theme layer (`theme.css`) |

`apps/www`, `packages/tests` and `templates/*` are `"private": true` and are
never published. Components themselves are **not** npm packages — they are
distributed through the registry at https://shadcn-aurelia.com/r (deployed
with the docs site).

## One-time setup

1. **npm account + organization.** Log in on [npmjs.com](https://www.npmjs.com),
   then *Add Organization* → name `shadcn-aurelia` (free, public packages).
   This owns the `@shadcn-aurelia/*` scope. The unscoped name `shadcn-aurelia`
   for the CLI is claimed by its first publish.
2. **Enable 2FA** on the account (Settings → Two-Factor Authentication).
3. **Local login:** `npm login` (or `npm login --scope=@shadcn-aurelia`).
   Verify with `npm whoami`.
4. For CI publishing (optional, below): create a **granular access token** on
   npmjs.com (Access Tokens → Generate New Token → Granular) with
   *Read and write* on the `@shadcn-aurelia` scope and the `shadcn-aurelia`
   package, and store it as the `NPM_TOKEN` secret in the GitHub repo.

## Release flow (manual)

From the repo root, on a clean `main`:

```sh
# 1. record what changed (creates .changeset/*.md; pick packages + bump + summary)
pnpm changeset

# 2. apply the changesets: bumps versions, writes CHANGELOGs, removes the .md files
#    (the changelog links to GitHub, so export a token first)
GITHUB_TOKEN=<a-classic-token-with-repo-read> pnpm release   # = changeset version

# 3. refresh the lockfile after the version bumps
pnpm install

# 4. commit the release
git add -A && git commit -m "release: version packages"

# 5. build + publish everything that has a version not yet on npm
pnpm publish-packages                                        # = pnpm build && changeset publish

# 6. push the commit and the tags changeset created (v-tags per package)
git push --follow-tags
```

Notes

- `changeset publish` only publishes packages whose `package.json` version is
  ahead of npm, so re-running is safe.
- `"access": "public"` in `.changeset/config.json` makes the scoped packages
  public on first publish (scoped packages default to private otherwise).
- With 2FA in *auth-and-writes* mode npm prompts for an OTP during publish;
  use *auth-only* (or an automation token) for unattended publishes.
- Dry run first: `pnpm build && pnpm -r publish --dry-run --no-git-checks`.

## Canary / snapshot releases

For testing a release without touching the real version line:

```sh
pnpm changeset version --snapshot canary   # e.g. 0.0.2-canary-20260706120000
pnpm build
pnpm changeset publish --tag canary        # installs only via @canary, never `latest`
git checkout -- .                          # discard the snapshot version bumps
```

Consumers try it with `npx shadcn-aurelia@canary init`.

## CI publishing (optional)

The standard Changesets automation: a workflow that opens a "Version
Packages" PR whenever changesets land on `main`, and publishes when that PR
is merged. Add `.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    branches: [main]
concurrency: release-${{ github.ref }}
permissions:
  contents: write
  pull-requests: write
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
          registry-url: https://registry.npmjs.org
      - run: pnpm install --frozen-lockfile
      - uses: changesets/action@v1
        with:
          version: pnpm release
          publish: pnpm publish-packages
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Requires the `NPM_TOKEN` secret from the one-time setup (and npm 2FA set to
*auth-only*, or an automation token, so CI can publish without an OTP).

## Checklist before the first real publish

- [ ] npm org `shadcn-aurelia` created; you are an owner
- [ ] `pnpm build && pnpm typecheck` green at the repo root
- [ ] `pnpm -r publish --dry-run --no-git-checks` shows the expected tarball
      contents (cli: `dist/`; primitives: `dist/`; tw-preset: `theme.css`)
- [ ] registry deployed at https://shadcn-aurelia.com/r (the CLI's default),
      or publish a CLI whose `--registry` docs point elsewhere first
- [ ] `npx shadcn-aurelia init && npx shadcn-aurelia add button` works on a
      fresh app against the live registry
