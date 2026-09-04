# Role & Responsibility Documentation — Update & Maintenance Guide (Internal)

> **Audience:** Village of Mundelein IT staff who make changes to this
> application. This is **internal** documentation, not client-facing
> material.

This guide covers cloning the repo, making changes, rebuilding, and
redeploying the SPFx web part. See `docs/APPLICATION-LIFECYCLE.md` first for
architecture context — in particular, note that this repository has a
current baseline (`main`) and a pending rebrand (PR #1, branch
`abakheet1-spfx-audit`) that adds the Admin Access upload feature; this guide
notes where the two differ.

## 1. Prerequisites

- Node.js in range `>=18.17.1 <19.0.0` or `>=20.9.0 <21.0.0` (`main`) /
  `>=20.11.0 <21.0.0` (PR #1) — see `package.json` → `engines`.
- npm (comes with Node).
- Git.
- Access to the target SharePoint tenant's App Catalog
  (`communityessentials.sharepoint.com`) with permission to upload/deploy
  packages.
- Recommended: SharePoint Online Management Shell or admin center access for
  tenant-wide deployment/permissions management.

## 2. First-time setup

```powershell
git clone https://github.com/JonEricEubanks/sop-repo.git
cd sop-repo
npm install
```

Repository: https://github.com/JonEricEubanks/sop-repo

## 3. Local development loop

```powershell
gulp serve
```

This opens the local SPFx workbench. For real data (SharePoint lists and
library), test against the **hosted workbench** on a real SharePoint site,
or add the web part to a test page in the target site collection using the
debug manifest — the local workbench cannot authenticate PnP.js calls to
SharePoint.

Typical edit loop:

1. Identify the component/service/model that owns the behavior you're
   changing (see the code architecture table in
   `docs/APPLICATION-LIFECYCLE.md`).
2. If the SharePoint data contract changes (new/renamed column, new list),
   update the model (`models/*.ts`) **and** the field resolution logic in
   `services/SopService.ts` together.
3. Update the React component(s) that render the affected UI.
4. If the change needs a new configurable option, add it to
   `ISopRepositoryWebPartProps` and the property pane in
   `SopRepositoryWebPart.ts`.
5. Run a build to catch type errors:
   ```powershell
   gulp build
   ```

## 4. Common change scenarios

### A SharePoint column was renamed or a list was recreated

- **On the PR #1 branch**, field internal names are resolved dynamically at
  runtime from each list's schema (`SopService._resolveFieldName()`), so a
  display-name rename is usually handled automatically — no code change
  needed as long as the **display name** used in `DISPLAY_NAMES` still
  matches what's in SharePoint.
- **On `main`**, internal names are hardcoded in the `FIELDS` constant at
  the top of `SopService.ts`. If SharePoint's internal name changes (e.g.
  the column was deleted and recreated), verify it directly:
  ```
  GET {sopSiteUrl}/_api/web/lists/getbytitle('Process')/fields?$select=InternalName,Title
  ```
  then update the matching constant in `FIELDS`.

### Adding a new displayed field (e.g. an additional metadata column)

1. Add the field's display name to `DISPLAY_NAMES` (PR #1) or the internal
   name to `FIELDS` (`main`) in `SopService.ts`.
2. Add it to the relevant `.select(...)` call and to the object returned by
   the corresponding `get...` method.
3. Add the field to the matching model in `models/`.
4. Surface it in the UI (`SopCard`, `DocumentPreviewPanel`, etc.) as needed.

### Changing how a process is marked "documented" vs. "undocumented"

A process is **documented** if its Process-list `Document Link` is non-empty
**or** at least one library document's title matches the process title
(case-insensitive). This join/derivation lives in `hooks/useSopData.ts` —
keep this logic in one place if you change it. The legacy "Has SOP" boolean
column is intentionally ignored everywhere (treated as stale data).

### Adding or changing the Admin Access / upload feature (PR #1 branch only)

- The gate itself is `SopService.isAdmin()` — it checks the configured
  `adminListName` list for a row where the Person column matches the
  signed-in user's email/UPN **and** the Choice column value is exactly
  `"Admin"`. It fails closed on any error.
- The upload flow is `SopService.uploadDocument()` — it uploads the file,
  then stamps Role, Process (lookup), Document Type, Status, and optionally
  Owner on the new library item, and back-fills the Process record's
  `Document Link` only if it was previously blank.
- If you need a second access level (e.g. "Reviewer"), extend the
  `AccessLevel` comparison in `isAdmin()` — do not just add a second list,
  since `useIsAdmin.ts` is the single hook every component relies on.

### Adding a new property-pane setting

Update, together:
- `ISopRepositoryWebPartProps` in `SopRepositoryWebPart.ts`
- The `groupFields` array in `getPropertyPaneConfiguration()`
- `ISopRepositoryProps` (component props contract)
- Any default value logic in `render()`/`_initService()`
- The matching label string in `loc/en-us.js` / `loc/mystrings.d.ts`

## 5. Build validation before shipping

```powershell
gulp build
```

Fix any TypeScript/lint errors before proceeding. There is a placeholder
`npm test` (`jest --passWithNoTests`) — if real tests are added later, make
sure they run cleanly here too.

## 6. Packaging a new release

```powershell
gulp clean
gulp bundle --ship
gulp package-solution --ship
```

This regenerates the `.sppkg` under `sharepoint/solution/`
(`sop-repository.sppkg` on `main`, `role-responsibility-documentation.sppkg`
on PR #1).

**Before packaging, bump the version** in `config/package-solution.json`
(`solution.version`, format `Major.Minor.Build.Revision`, e.g. `1.0.0.0` →
`1.1.0.0`) so the App Catalog recognizes it as a new release and prompts
existing sites to update.

Commit the refreshed `.sppkg` (it is tracked in source control so anyone can
deploy without a local build) along with any source changes.

## 7. Deploying to SharePoint

1. Go to the tenant or site collection **App Catalog** on
   `communityessentials.sharepoint.com`.
2. Upload/replace the appropriate `.sppkg` from `sharepoint/solution/`.
3. If prompted, choose **Replace** the existing app version, and check
   "Make this solution available to all sites in the organization" only if
   that matches current distribution intent.
4. Both branches set `skipFeatureDeployment: true`, so the app deploys
   tenant-wide automatically without a manual per-site feature-activation
   step — existing pages using the web part pick up the new version
   automatically (may take a few minutes / a page refresh).
5. If this is a first-time install on a new site, add the web part to a
   page from the web part picker, then configure the property pane
   (`sopSiteUrl`, `libraryName`, `processListName`, `rolesListName`, and —
   on the PR #1 build — `adminListName`).
6. If deploying the PR #1 build, also create the **Admin Access** list on
   the target site (Person column, e.g. `UserPrincipalName`; Choice column
   `AccessLevel` with at least the value `Admin`) before anyone expects the
   Upload button to appear.

## 8. Rollback

Keep the previous `.sppkg` available (via git history —
`git show <previous-commit>:sharepoint/solution/<file>.sppkg`) and re-upload
it in the App Catalog if a release causes problems.

## 9. Where to look when something breaks

| Symptom | Likely cause | Where to look |
|---|---|---|
| No roles show up | `rolesListName`/`sopSiteUrl` misconfigured, or `Active` filter excludes all rows | Property pane values; `Roles` list `Active` column |
| Processes/documents empty for a role | Internal field name mismatch, or value mismatch (extra whitespace/case) | `SopService.ts` `FIELDS`/`DISPLAY_NAMES`; actual list schema via REST `$select=InternalName,Title` |
| Everything shows as "Undocumented" | `Document Link` column empty and no library document title matches the process title | `useSopData.ts` join logic; `Document Link` and `Process` (library) values |
| Upload button never appears (PR #1) | User isn't listed in the Admin Access list with `AccessLevel = Admin`, or `adminListName` is misconfigured | `SopService.isAdmin()`; the configured Admin Access list |
| Upload fails | File name collision handling, missing library write permission, or a resolved field name that doesn't match the library's schema | `SopService.uploadDocument()`; browser console error surfaced in the dialog's error banner |
| Build fails | Wrong Node version, or TypeScript errors from a data-contract change | `package.json` engines; run `gulp build` for the exact TS error |
| Web part doesn't update after new package upload | Browser/SharePoint cache, or App Catalog didn't propagate yet | Hard refresh; wait a few minutes; confirm version bumped in `package-solution.json` |
