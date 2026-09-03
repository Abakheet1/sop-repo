# SOP Repository — Update & Maintenance Guide

This guide is for anyone (developer or GitHub Copilot) who needs to change,
rebuild, and redeploy the SOP Repository SPFx web part.

## 1. Prerequisites

- Node.js version in range `>=18.17.1 <19.0.0` or `>=20.9.0 <21.0.0`
  (see `package.json` → `engines`).
- npm (comes with Node).
- Access to the target SharePoint tenant's App Catalog
  (`communityessentials.sharepoint.com`) with permission to upload/deploy
  packages.
- Recommended: SharePoint Online Management Shell or admin center access if
  you need to manage tenant-wide deployment/permissions.

## 2. First-time setup

```powershell
cd sop-repo
npm install
```

## 3. Local development loop

```powershell
gulp serve
```
This opens the local SPFx workbench. For real data (SharePoint lists/library),
test against the **hosted workbench** on a real SharePoint site, or add the
web part to a test page in the target site collection using the debug
manifest, since the local workbench cannot authenticate PnP.js calls to
SharePoint.

Typical edit loop:
1. Identify the component/service/model that owns the behavior you're
   changing (see layout in `docs/APPLICATION-LIFECYCLE.md`).
2. If the SharePoint data contract changes (new/renamed column, new list),
   update the model (`models/*.ts`) **and** the field constants /
   query logic in `services/SopService.ts` together.
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
- SharePoint REST calls use **internal names**, not display names, and they
  get URL-encoded (spaces → `_x0020_`, parentheses → `_x0028_`/`_x0029_`).
- Verify the actual internal name:
  ```
  GET {sopSiteUrl}/_api/web/lists/getbytitle('Process')/fields?$select=InternalName,Title
  ```
- Update the relevant constant in the `FIELDS` object at the top of
  `src/webparts/sopRepository/services/SopService.ts`.

### Adding a new displayed field (e.g. an "Owner" column)
1. Add the internal-name constant to `FIELDS` in `SopService.ts`.
2. Add it to the relevant `.select(...)` call and to the object returned by
   the corresponding `get...` method.
3. Add the field to the matching model in `models/`.
4. Surface it in the UI (`SopCard`, `DocumentPreviewPanel`, etc. as needed).

### Changing gap detection logic
Gap detection is intentionally derived at runtime from whether
`documentLink` is empty (the legacy "Has SOP" boolean column is ignored as
stale) — see comments in `models/IProcess.ts` and `SopService.ts`. Keep this
derivation in one place if you change it.

### Adding a new property-pane setting
Update, together:
- `ISopRepositoryWebPartProps` in `SopRepositoryWebPart.ts`
- The `groupFields` array in `getPropertyPaneConfiguration()`
- `ISopRepositoryProps` (component props contract)
- Any default value logic in `render()`/`_initService()`

## 5. Build validation before shipping

```powershell
gulp build
```
Fix any TypeScript/lint errors before proceeding. There is a placeholder
`npm test` (`jest --passWithNoTests`) — if you add real tests, make sure they
run cleanly here too.

## 6. Packaging a new release

```powershell
gulp clean
gulp bundle --ship
gulp package-solution --ship
```
This regenerates `sharepoint/solution/sop-repository.sppkg`.

**Before packaging, bump the version** in
`config/package-solution.json` (`solution.version`, format `Major.Minor.Build.Revision`,
e.g. `1.0.0.0` → `1.1.0.0`) so the App Catalog recognizes it as a new release
and prompts existing sites to update.

Commit the refreshed `.sppkg` (it is tracked in source control so anyone can
deploy without a local build) along with any source changes.

## 7. Deploying to SharePoint

1. Go to the tenant or site collection **App Catalog** on
   `communityessentials.sharepoint.com`.
2. Upload/replace `sharepoint/solution/sop-repository.sppkg`.
3. If prompted, choose **Replace** the existing app version, and check
   "Make this solution available to all sites in the organization" only if
   that matches current distribution intent.
4. Since `skipFeatureDeployment: true` is set, the app is deployed
   automatically tenant-wide without a manual per-site "feature activation"
   step — existing pages using the web part pick up the new version
   automatically (may take a few minutes / a page refresh).
5. If this is a first-time install on a new site, add the **SOP Repository**
   web part to a page from the web part picker, then configure the property
   pane (`sopSiteUrl`, `libraryName`, `processListName`, `rolesListName`).

## 8. Rollback

Keep the previous `.sppkg` available (via git history —
`git show <previous-commit>:sharepoint/solution/sop-repository.sppkg`) and
re-upload/replace it in the App Catalog if a release causes problems.

## 9. Where to look when something breaks

| Symptom | Likely cause | Where to look |
|---|---|---|
| No roles show up | `rolesListName`/`sopSiteUrl` misconfigured, or `Active` filter excludes all rows | Property pane values; `Roles` list `Active` column |
| Processes/documents empty for a role | Internal field name mismatch (`Role_x0020__x0028_Choice_x0029_`) or value mismatch (extra whitespace) | `SopService.ts` `FIELDS` constants; actual list schema via REST `$select=InternalName,Title` |
| Everything shows as a "gap" | `Document Link` column empty or its internal name wrong | `FIELDS.DOCUMENT_LINK` in `SopService.ts` |
| Build fails | Wrong Node version, or TypeScript errors from a data-contract change | `package.json` engines; run `gulp build` for the exact TS error |
| Web part doesn't update after new package upload | Browser/SharePoint cache, or App Catalog didn't propagate yet | Hard refresh; wait a few minutes; confirm version bumped in `package-solution.json` |
