# Changesets

Version and publish `@wse/*` packages with [changesets](https://github.com/changesets/changesets).

- After a change that should ship, run `npx changeset` and pick the affected packages + bump type.
- CI (`.github/workflows/release.yml`) opens a "Version Packages" PR; merging it publishes to GitHub Packages.
- The engine packages (`@wse/sdk`, `@wse/core`, `@wse/admin`, `@wse/cms-bridge`) are version-linked so site apps pin one coherent engine version. Template and plugin packages version independently.
- Site apps (`apps/*`) are never published.

Note: GitHub Packages only accepts scopes matching the repository owner. Publishing under the `@wse` scope requires a GitHub org named `wse` (or configure `scope-rewrite` / rename the scope before first publish).
